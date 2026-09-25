import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Edit2, ChevronRight, Keyboard } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Waveform } from '../../components/animations/Waveform';
import { speechService } from '../../services/speech.service';
import type { SpeechResult } from '../../types';

export const VoiceLogPage: React.FC = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [speechResult, setSpeechResult] = useState<SpeechResult | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [manualText, setManualText] = useState('');
  const [mode, setMode] = useState<'voice' | 'typed'>('voice');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMode('typed');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const result = await speechService.transcribe(audioBlob);
          setSpeechResult(result);
          setTranscript(result.transcript);
        } catch (e) {
          console.error(e);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Analyze sound levels
      const updateLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length / 255;
        setAudioLevel(avg);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch {
      // Permission denied or audio not accessible
      setMode('typed');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const handleManualParse = () => {
    if (!manualText.trim()) return;
    const res = speechService.parseTypedText(manualText);
    setSpeechResult(res);
    setTranscript(res.transcript);
  };

  const handleConfirmItems = () => {
    const topItem = speechResult?.extractedItems[0];
    const foodId = topItem?.matchedFoodId || 'food-idli';
    navigate(`/log/portion?foodId=${foodId}`);
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Voice Meal Logging"
        subtitle="Speak your meal naturally in English or Hinglish."
        showBack
      />

      {mode === 'voice' ? (
        <Card padding="lg" className="flex flex-col items-center text-center">
          <div className="h-28 w-full flex items-center justify-center my-4">
            <Waveform isRecording={isRecording} audioLevel={audioLevel} barCount={24} />
          </div>

          <p className="text-sm font-semibold text-ink-light dark:text-ink-dark mb-1">
            {isRecording
              ? 'Listening… speak your meal'
              : isTranscribing
              ? 'Transcribing audio…'
              : 'Tap microphone and speak'}
          </p>
          <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark max-w-xs mb-6">
            e.g. "Two idlis, one medu vada and one filter coffee"
          </p>

          {/* Mic Record Button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing}
            aria-label={isRecording ? 'Stop listening' : 'Start voice recording'}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-soft-lg transition-all duration-base active:scale-95 ${
              isRecording
                ? 'bg-rose-500 animate-pulse ring-8 ring-rose-500/20'
                : 'bg-brand-light hover:bg-brand-hover dark:bg-brand-dark dark:text-ink-light'
            }`}
          >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>

          <button
            type="button"
            onClick={() => setMode('typed')}
            className="mt-8 text-xs font-semibold text-brand-light dark:text-brand-dark hover:underline flex items-center gap-1.5"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Type instead (Microphone unavailable)</span>
          </button>
        </Card>
      ) : (
        /* Typed Fallback */
        <Card padding="lg">
          <label className="block text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider mb-2">
            Type Your Meal Description
          </label>
          <textarea
            rows={3}
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="e.g. 2 idlis, 1 vada and a filter coffee"
            className="w-full p-3.5 rounded-2xl bg-surface-2-light dark:bg-surface-2-dark border border-black/10 dark:border-white/10 text-sm text-ink-light dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-light"
          />
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setMode('voice')}
              className="text-xs font-semibold text-ink-muted-light hover:text-ink-light flex items-center gap-1"
            >
              <Mic className="w-3.5 h-3.5" /> Switch to Voice
            </button>
            <Button size="sm" onClick={handleManualParse} disabled={!manualText.trim()}>
              Parse Foods
            </Button>
          </div>
        </Card>
      )}

      {/* Structured Result Review */}
      {speechResult && (
        <Card padding="md" className="flex flex-col gap-4 border-2 border-brand-light/30">
          <div>
            <span className="text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider block mb-1">
              Transcribed Meal
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="flex-1 text-sm font-semibold text-ink-light dark:text-ink-dark bg-transparent border-b border-black/10 dark:border-white/10 pb-1 focus:outline-none focus:border-brand-light"
              />
              <Edit2 className="w-3.5 h-3.5 text-ink-muted-light" />
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider block mb-2">
              Parsed Dishes & Quantities
            </span>
            <div className="flex flex-col gap-2">
              {speechResult.extractedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2-light dark:bg-surface-2-dark text-xs font-semibold"
                >
                  <span>{item.name}</span>
                  <span className="font-mono text-brand-light dark:text-brand-dark">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            fullWidth
            onClick={handleConfirmItems}
            rightIcon={<ChevronRight className="w-5 h-5" />}
          >
            Confirm & Calculate Nutrition
          </Button>
        </Card>
      )}
    </div>
  );
};

export default VoiceLogPage;
