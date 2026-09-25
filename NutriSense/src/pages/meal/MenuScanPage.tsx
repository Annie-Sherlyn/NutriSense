import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button, IconButton } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { UploadZone } from '../../components/common/UploadZone';
import { ScanLine } from '../../components/animations/ScanLine';
import { ocrService } from '../../services/ocr.service';
import type { OCRResult } from '../../types';

export const MenuScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

  const handleFileSelect = async (selected: File) => {
    setFile(selected);
    setIsScanning(true);
    try {
      const res = await ocrService.parseMenu(selected);
      setOcrResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleItemSelect = (id: string) => {
    if (!ocrResult) return;
    setOcrResult({
      ...ocrResult,
      items: ocrResult.items.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it)),
    });
  };

  const updateItemName = (id: string, name: string) => {
    if (!ocrResult) return;
    setOcrResult({
      ...ocrResult,
      items: ocrResult.items.map((it) => (it.id === id ? { ...it, name } : it)),
    });
  };

  const updateItemPrice = (id: string, price: number) => {
    if (!ocrResult) return;
    setOcrResult({
      ...ocrResult,
      items: ocrResult.items.map((it) => (it.id === id ? { ...it, price } : it)),
    });
  };

  const removeItem = (id: string) => {
    if (!ocrResult) return;
    setOcrResult({
      ...ocrResult,
      items: ocrResult.items.filter((it) => it.id !== id),
    });
  };

  const handleAnalyzeMenu = () => {
    if (!ocrResult) return;
    navigate('/log/menu/results', {
      state: { ocrResult },
    });
  };

  const selectedCount = ocrResult?.items.filter((it) => it.selected).length || 0;
  const totalPrice =
    ocrResult?.items
      .filter((it) => it.selected)
      .reduce((sum, it) => sum + (it.price || 0), 0) || 0;

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Restaurant Menu OCR"
        subtitle="Photograph or upload any physical hotel menu to extract dishes."
        showBack
      />

      {/* Upload or Scanning Line */}
      {!ocrResult ? (
        isScanning ? (
          <div className="p-8 rounded-3xl bg-black/80 flex flex-col items-center justify-center text-white min-h-[300px]">
            <ScanLine label="Reading menu text & prices…" />
          </div>
        ) : (
          <UploadZone
            onFileSelect={handleFileSelect}
            selectedFile={file}
            accept="image/*"
            title="Upload Photo of Restaurant Menu"
            subtitle="Snap menu card, blackboard, or printed tiffin tariff (JPG, PNG)"
          />
        )
      ) : (
        /* Extracted Items Review & Edit */
        <div className="flex flex-col gap-4">
          <Card padding="md" className="flex items-center justify-between">
            <div>
              <span className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
                Extracted from
              </span>
              <h3 className="font-display font-bold text-base text-ink-light dark:text-ink-dark">
                {ocrResult.restaurantName || 'Restaurant Menu'}
              </h3>
            </div>
            <button
              onClick={() => {
                setOcrResult(null);
                setFile(null);
              }}
              className="text-xs font-semibold text-brand-light dark:text-brand-dark hover:underline"
            >
              Scan Another
            </button>
          </Card>

          {/* Item checklist */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1 text-xs">
              <span className="font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider">
                Select items to analyze
              </span>
              <span className="font-mono text-ink-muted-light dark:text-ink-muted-dark">
                {selectedCount} items selected • ₹{totalPrice}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {ocrResult.items.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    item.selected
                      ? 'bg-surface-light dark:bg-surface-dark border-brand-light/40 dark:border-brand-dark/40 shadow-soft'
                      : 'bg-surface-2-light/50 dark:bg-surface-2-dark/40 border-black/5 dark:border-white/5 opacity-70'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleItemSelect(item.id)}
                    className="w-5 h-5 rounded-lg accent-brand-light dark:accent-brand-dark cursor-pointer flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItemName(item.id, e.target.value)}
                      className="flex-1 bg-transparent text-xs sm:text-sm font-semibold text-ink-light dark:text-ink-dark border-b border-transparent focus:border-brand-light focus:outline-none"
                    />

                    <div className="flex items-center gap-1">
                      <span className="text-xs text-ink-muted-light dark:text-ink-muted-dark font-mono">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItemPrice(item.id, parseInt(e.target.value, 10) || 0)}
                        className="w-16 bg-transparent text-xs sm:text-sm font-mono font-bold text-ink-light dark:text-ink-dark border-b border-transparent focus:border-brand-light focus:outline-none"
                      />
                    </div>
                  </div>

                  <IconButton
                    icon={<Trash2 className="w-4 h-4 text-ink-muted-light hover:text-rose-500" />}
                    aria-label="Remove item"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            fullWidth
            onClick={handleAnalyzeMenu}
            rightIcon={<ChevronRight className="w-5 h-5" />}
          >
            Analyze Menu Choices ({selectedCount})
          </Button>
        </div>
      )}
    </div>
  );
};

export default MenuScanPage;
