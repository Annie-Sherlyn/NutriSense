import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image, Zap, ZapOff, RefreshCw, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button, IconButton } from '../../components/common/Button';
import { ScanLine } from '../../components/animations/ScanLine';
import { NutriMote } from '../../components/animations/NutriMote';
import { foodService } from '../../services/food.service';

export const DishCapturePage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize camera with getUserMedia (if supported and permitted)
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasCamera(false);
          return;
        }
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        activeStream = mediaStream;
        setHasCamera(true);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch {
        // Camera permission denied or not available
        setHasCamera(false);
      }
    };

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      try {
        sessionStorage.setItem('nutrisense_captured_image', dataUrl);
      } catch {
        // storage quota fallback
      }
      canvas.toBlob((blob) => {
        if (blob) processFile(new File([blob], 'camera-dish.jpg', { type: 'image/jpeg' }), dataUrl);
      }, 'image/jpeg', 0.85);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setCapturedImage(objectUrl);

      // Also read as base64 for persistent session storage
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = (event.target?.result as string) || '';
        try {
          if (dataUrl.length < 3500000) {
            sessionStorage.setItem('nutrisense_captured_image', dataUrl);
          }
        } catch {
          // ignore quota
        }
      };
      reader.readAsDataURL(file);

      processFile(file, objectUrl);
    }
  };

  const processFile = async (file: File, previewUrl?: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await foodService.analyzeImage(file);
      const imageToShow = previewUrl || capturedImage || '';
      if (imageToShow) {
        try {
          sessionStorage.setItem('nutrisense_captured_image', imageToShow);
        } catch {
          // ignore quota
        }
      }
      // Navigate to results screen with state
      navigate('/log/photo/result', {
        state: {
          analysisResult: result,
          candidates: result.candidates,
          detectedItems: result.detectedItems,
          isMultiItem: result.isMultiItem,
          plateMessage: result.plateMessage,
          annotatedImage: result.annotatedImage,
          capturedImage: imageToShow,
        },
      });
    } catch (err: unknown) {
      const appErr = err as { message?: string };
      setError(appErr.message || 'Could not analyze dish. Please retry or search manually.');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-4">
      <PageHeader
        title="Dish Photo Capture"
        subtitle="Frame your dish in the center for highest DL confidence"
        showBack
      />

      {error && (
        <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Squared Viewfinder Outline Box */}
      <div className="relative w-full aspect-square max-w-sm mx-auto rounded-3xl overflow-hidden bg-black flex items-center justify-center shadow-soft-lg border-2 border-emerald-500/50 p-1">
        <div className="w-full h-full rounded-2xl overflow-hidden relative flex items-center justify-center bg-zinc-950">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured plate" className="w-full h-full object-cover" />
          ) : hasCamera ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            /* Camera Fallback UI */
            <div className="flex flex-col items-center justify-center p-6 text-center text-white/90">
              <Camera className="w-12 h-12 text-white/50 mb-3" />
              <p className="text-sm font-semibold mb-1">Camera mode</p>
              <p className="text-xs text-white/70 max-w-xs mb-4">
                Tap below to take a photo or pick a dish image from your gallery.
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Image className="w-4 h-4" />}
              >
                Choose Photo
              </Button>
            </div>
          )}

          {/* Analyzing Scan Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] p-6 text-center text-white">
              <ScanLine label="Deep Learning: Analyzing Indian dish candidates…" />
              <div className="mt-4 flex items-center gap-2">
                <NutriMote type="protein" mood="curious" size={36} />
                <span className="text-xs text-white/90 font-medium">Identifying ingredients & portion…</span>
              </div>
            </div>
          )}

          {/* Viewfinder Framing Guidelines */}
          {!isAnalyzing && (
            <div className="absolute inset-6 border border-white/30 rounded-xl pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
              </div>
              <div className="text-center text-[10px] text-white/80 font-medium tracking-wide">
                Center plate in squared frame
              </div>
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
              </div>
            </div>
          )}

          {/* Top Controls Overlay */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <IconButton
              icon={flashOn ? <Zap className="w-5 h-5 text-amber-400" /> : <ZapOff className="w-5 h-5 text-white" />}
              aria-label="Toggle flash"
              onClick={() => setFlashOn(!flashOn)}
              size="sm"
              className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-md"
            />
          </div>
        </div>
      </div>

      {/* Hidden file input with environment capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Bottom Controls Bar */}
      <div className="flex items-center justify-around py-3">
        {/* Gallery button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Pick from gallery"
          className="flex flex-col items-center gap-1 text-xs text-ink-muted-light dark:text-ink-muted-dark hover:text-ink-light dark:hover:text-ink-dark"
        >
          <div className="w-12 h-12 rounded-full bg-surface-2-light dark:bg-surface-2-dark flex items-center justify-center border border-black/10 dark:border-white/10">
            <Image className="w-5 h-5" />
          </div>
          <span>Gallery</span>
        </button>

        {/* Shutter capture button */}
        <button
          type="button"
          onClick={hasCamera ? handleCapturePhoto : () => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          aria-label="Capture photo"
          className="w-20 h-20 rounded-full border-4 border-white p-1 shadow-soft-lg active:scale-95 transition-transform bg-brand-light dark:bg-brand-dark flex items-center justify-center text-white"
        >
          <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center">
            <Camera className="w-8 h-8" />
          </div>
        </button>

        {/* Manual search fallback */}
        <button
          type="button"
          onClick={() => navigate('/log/search')}
          aria-label="Manual search"
          className="flex flex-col items-center gap-1 text-xs text-ink-muted-light dark:text-ink-muted-dark hover:text-ink-light dark:hover:text-ink-dark"
        >
          <div className="w-12 h-12 rounded-full bg-surface-2-light dark:bg-surface-2-dark flex items-center justify-center border border-black/10 dark:border-white/10">
            <RefreshCw className="w-5 h-5" />
          </div>
          <span>Search</span>
        </button>
      </div>

      {/* Tips */}
      <div className="text-center text-xs text-ink-muted-light dark:text-ink-muted-dark">
        Works best with thalis, dosas, idlis, chapatis, biryani & chaats.
      </div>
    </div>
  );
};

export default DishCapturePage;
