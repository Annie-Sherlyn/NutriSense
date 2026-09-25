import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { UploadZone } from '../../components/common/UploadZone';
import { ScanLine } from '../../components/animations/ScanLine';
import { ocrService } from '../../services/ocr.service';
import type { OCRResult } from '../../types';

interface DeliveryItemWithQty {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  matchedFoodId?: string;
}

export const DeliveryScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [itemsWithQty, setItemsWithQty] = useState<DeliveryItemWithQty[]>([]);

  const handleFileSelect = async (selected: File) => {
    setFile(selected);
    setIsExtracting(true);
    try {
      const res = await ocrService.parseDeliveryScreenshot(selected);
      setOcrResult(res);
      setItemsWithQty(
        res.items.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price,
          quantity: 1,
          description: it.description,
          matchedFoodId: it.matchedFoodId,
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsExtracting(false);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setItemsWithQty((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, quantity: Math.max(0, it.quantity + delta) } : it))
        .filter((it) => it.quantity > 0)
    );
  };

  const total = itemsWithQty.reduce((acc, it) => acc + it.price * it.quantity, 0);

  const handleAnalyze = () => {
    navigate('/log/delivery/results', {
      state: {
        restaurantName: ocrResult?.restaurantName,
        items: itemsWithQty,
      },
    });
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Delivery App Screenshot"
        subtitle="Upload your cart or order preview screenshot. Plain visual OCR extracts dishes before you checkout."
        showBack
      />

      {/* Strict copy disclaimer */}
      <div className="p-3.5 rounded-2xl bg-surface-2-light dark:bg-surface-2-dark border border-black/5 dark:border-white/5 text-xs text-ink-muted-light dark:text-ink-muted-dark leading-relaxed">
        <strong>Privacy note:</strong> NutriSense reads plain screenshots client-side. We have no affiliation with or direct integration into third-party delivery platforms.
      </div>

      {!ocrResult ? (
        isExtracting ? (
          <div className="p-8 rounded-3xl bg-black/80 flex flex-col items-center justify-center text-white min-h-[300px]">
            <ScanLine label="Extracting items from delivery screenshot…" />
          </div>
        ) : (
          <UploadZone
            onFileSelect={handleFileSelect}
            selectedFile={file}
            accept="image/*"
            title="Upload Order Screenshot"
            subtitle="Take a screenshot of your food delivery cart (JPG, PNG)"
          />
        )
      ) : (
        <div className="flex flex-col gap-4">
          <Card padding="md" className="flex items-center justify-between">
            <div>
              <span className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
                Extracted Restaurant
              </span>
              <h3 className="font-display font-bold text-base text-ink-light dark:text-ink-dark">
                {ocrResult.restaurantName}
              </h3>
            </div>
            <button
              onClick={() => {
                setOcrResult(null);
                setFile(null);
              }}
              className="text-xs font-semibold text-brand-light dark:text-brand-dark hover:underline"
            >
              Upload Another
            </button>
          </Card>

          {/* Extracted items with quantity steppers */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider block px-1">
              Extracted Cart Items
            </span>

            {itemsWithQty.map((item) => (
              <Card key={item.id} padding="sm" className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-display font-semibold text-sm text-ink-light dark:text-ink-dark truncate">
                    {item.name}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  )}
                  <span className="text-xs font-mono font-bold text-ink-light dark:text-ink-dark mt-1 block">
                    ₹{item.price} each
                  </span>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-2 bg-surface-2-light dark:bg-surface-2-dark rounded-full p-1 border border-black/5 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5 text-ink-light dark:text-ink-dark" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold font-mono text-ink-light dark:text-ink-dark">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5 text-ink-light dark:text-ink-dark" />
                  </button>
                </div>
              </Card>
            ))}

            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-2-light dark:bg-surface-2-dark text-xs font-bold">
              <span>Estimated Order Total</span>
              <span className="font-mono text-sm">₹{total}</span>
            </div>
          </div>

          <Button
            size="lg"
            fullWidth
            onClick={handleAnalyze}
            rightIcon={<ChevronRight className="w-5 h-5" />}
          >
            Analyze Choices ({itemsWithQty.length})
          </Button>
        </div>
      )}
    </div>
  );
};

export default DeliveryScanPage;
