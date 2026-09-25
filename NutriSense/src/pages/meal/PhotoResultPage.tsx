import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Camera, RefreshCw, AlertTriangle, ChevronRight, Layers, Eye, Target, Sparkles } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ConfidenceBadge } from '../../components/common/ConfidenceBadge';
import { FoodImage } from '../../components/food/FoodImage';
import type { FoodCandidate, DetectedPlateItem, FoodAnalysisResponse } from '../../types';

export const PhotoResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as {
    analysisResult?: FoodAnalysisResponse;
    candidates?: FoodCandidate[];
    detectedItems?: DetectedPlateItem[];
    isMultiItem?: boolean;
    plateMessage?: string;
    annotatedImage?: string;
    capturedImage?: string;
  } | null;

  const capturedImage =
    state?.capturedImage ||
    sessionStorage.getItem('nutrisense_captured_image') ||
    '';

  const isMultiItem = Boolean(state?.isMultiItem || (state?.detectedItems && state.detectedItems.length > 1));
  const detectedItems: DetectedPlateItem[] = state?.detectedItems || [];
  const candidates: FoodCandidate[] = state?.candidates || detectedItems;
  
  // If no state or predictions are available (e.g., navigated directly), redirect back
  if (!state || candidates.length === 0) {
    return <div className="p-8 text-center text-red-500">No analysis result found. Please <a href="/log/photo" className="underline">retake photo</a>.</div>;
  }

  const topPrediction = candidates[0] || detectedItems[0];
  const isLowConfidence = topPrediction.confidence < 0.50;
  const [selectedCandidateId, setSelectedCandidateId] = useState(topPrediction.id);

  // Multi-item selection state (default all detected items selected)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    detectedItems.map((d) => d.id)
  );

  // Toggle bounding box view if annotatedImage or coordinates exist
  const [showBoxes, setShowBoxes] = useState(true);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (isMultiItem) {
      const confirmedDishes = detectedItems.filter((d) => selectedItemIds.includes(d.id));
      navigate('/log/portion', {
        state: {
          capturedImage,
          isMultiItem: true,
          confirmedDishes: confirmedDishes.length > 0 ? confirmedDishes : [topPrediction],
        },
      });
    } else {
      navigate(`/log/portion?foodId=${selectedCandidateId}`, {
        state: { capturedImage },
      });
    }
  };

  const displayImage = (showBoxes && state?.annotatedImage) ? state.annotatedImage : capturedImage;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 pb-8">
      <PageHeader
        title={isMultiItem ? "Multi-Dish Plate Detected" : "Confirm Your Dish"}
        subtitle={
          isMultiItem
            ? state?.plateMessage || `Identified ${detectedItems.length} distinct dishes on your plate.`
            : "Our vision model analyzed your plate. Please confirm the correct dish before calculating nutrition."
        }
        showBack
      />

      {/* Hero Vision Inspector Container */}
      <div className="flex flex-col gap-4 p-4 sm:p-5 rounded-3xl bg-surface-light dark:bg-surface-dark border border-black/10 dark:border-white/10 shadow-soft">
        {/* Main Photo Viewport */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[380px] rounded-2xl border-2 border-emerald-500/50 dark:border-emerald-400/50 bg-black/90 shadow-md ring-4 ring-emerald-500/10 dark:ring-emerald-400/10 overflow-hidden flex items-center justify-center">
          {displayImage ? (
            <img
              src={displayImage}
              alt="Uploaded dish"
              className="w-full h-full object-contain"
            />
          ) : (
            <FoodImage
              src={topPrediction.image || '/images/food/idli.svg'}
              alt="Your photo"
              className="w-full h-full object-cover"
            />
          )}

          {/* Interactive SVG Bounding Boxes Overlay (shown when showBoxes is enabled & no OpenCV burnt image, or as interactive highlighter) */}
          {showBoxes && !state?.annotatedImage && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {detectedItems.map((item, idx) => {
                const box = item.box || [0.1 + idx * 0.2, 0.1 + idx * 0.15, 0.35, 0.35];
                const x = box[0] * 100;
                const y = box[1] * 100;
                const w = box[2] * 100;
                const h = box[3] * 100;
                const isSelected = selectedItemIds.includes(item.id);
                const isHovered = hoveredItemId === item.id;
                const color = item.color || '#2ECC71';

                return (
                  <g key={item.id} className="transition-all duration-200">
                    <rect
                      x={`${x}%`}
                      y={`${y}%`}
                      width={`${w}%`}
                      height={`${h}%`}
                      fill={isHovered ? `${color}25` : (isSelected ? `${color}10` : 'transparent')}
                      stroke={color}
                      strokeWidth={isHovered || isSelected ? '2' : '1.5'}
                      strokeDasharray={isSelected ? 'none' : '3,2'}
                      rx="2"
                    />
                  </g>
                );
              })}
            </svg>
          )}

          {/* Top Badges & Control Bar */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold py-1 px-3 rounded-full bg-black/75 text-white backdrop-blur-md shadow-md border border-white/10">
              {isMultiItem ? (
                <>
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CV Multi-Object ({detectedItems.length} Dishes)</span>
                </>
              ) : (
                <>
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Single Dish Focus</span>
                </>
              )}
            </span>

            {(state?.annotatedImage || isMultiItem) && (
              <button
                type="button"
                onClick={() => setShowBoxes(!showBoxes)}
                aria-label="Toggle detection boxes"
                className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-md border transition-all flex items-center gap-1.5 ${
                  showBoxes
                    ? 'bg-emerald-600/90 hover:bg-emerald-600 text-white border-emerald-400/40 ring-2 ring-emerald-500/20'
                    : 'bg-black/70 hover:bg-black/90 text-white/90 border-white/10'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showBoxes ? 'Boxes: ON' : 'Boxes: OFF'}</span>
              </button>
            )}
          </div>

          {/* Bottom Dish Legend Overlay */}
          {isMultiItem && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-center gap-2 flex-wrap pointer-events-auto">
              {detectedItems.map((item) => {
                const isSelected = selectedItemIds.includes(item.id);
                const color = item.color || '#2ECC71';
                const cleanName = item.name.split(' (')[0];
                const pct = Math.round(item.confidence * 100);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItemSelection(item.id)}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold py-1 px-2.5 rounded-lg backdrop-blur-md shadow-sm transition-all border ${
                      isSelected
                        ? 'bg-black/85 text-white border-white/20 ring-1'
                        : 'bg-black/50 text-white/60 border-white/5 opacity-70'
                    }`}
                    style={{ borderColor: isSelected ? color : undefined }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span>{cleanName}</span>
                    <span className="font-mono opacity-80">{pct}%</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Prediction / Plate Summary Text */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 px-1">
          {isMultiItem ? (
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Computer Vision Localization</span>
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-ink-light dark:text-ink-dark leading-snug">
                {detectedItems.length} Dishes Found on Plate
              </h3>
              <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark mt-0.5">
                Each dish region has a distinct bounding box. Confirm or deselect dishes to log your meal.
              </p>
            </div>
          ) : (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1 block">
                Detected Dish
              </span>
              <h3 className="font-display font-bold text-lg sm:text-xl text-ink-light dark:text-ink-dark leading-snug">
                {topPrediction.name}
              </h3>
              {topPrediction.regionalName && (
                <p className="text-sm font-medium text-ink-muted-light dark:text-ink-muted-dark mt-0.5">
                  {topPrediction.regionalName}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
            <ConfidenceBadge confidence={topPrediction.confidence} showPercentage />
            {topPrediction.estimatedKcal && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-surface-2-light dark:bg-surface-2-dark font-medium text-ink-light dark:text-ink-dark border border-black/5 dark:border-white/5">
                {topPrediction.estimatedKcal}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Low Confidence Warning State */}
      {isLowConfidence && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-ink-light dark:text-ink-dark">
              We're not completely sure
            </h4>
            <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark mt-0.5 leading-relaxed">
              The top prediction confidence is below 50%. Please verify the dish below or search manually.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => navigate('/log/search')}>
                Search Manually
              </Button>
              <Button size="sm" variant="ghost" onClick={() => navigate('/log/photo')}>
                Retake Photo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dishes Selection List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider block">
            {isMultiItem
              ? `Plate Items Detected (${selectedItemIds.length} of ${detectedItems.length} selected)`
              : 'Ranked Predictions (Select One)'}
          </span>
          {isMultiItem && (
            <button
              type="button"
              onClick={() =>
                setSelectedItemIds(
                  selectedItemIds.length === detectedItems.length
                    ? [detectedItems[0].id]
                    : detectedItems.map((d) => d.id)
                )
              }
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {selectedItemIds.length === detectedItems.length ? 'Deselect Extra' : 'Select All'}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          {isMultiItem ? (
            detectedItems.map((item, idx) => {
              const isChecked = selectedItemIds.includes(item.id);
              const isHovered = hoveredItemId === item.id;
              const pct = Math.round(item.confidence * 100);
              const color = item.color || '#2ECC71';

              return (
                <Card
                  key={item.id}
                  onClick={() => toggleItemSelection(item.id)}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                  padding="sm"
                  className={`cursor-pointer transition-all border-2 flex items-center justify-between ${
                    isChecked
                      ? 'border-emerald-500/80 dark:border-emerald-400/80 bg-emerald-500/[0.04] dark:bg-emerald-400/[0.08] shadow-soft'
                      : 'border-black/[0.06] dark:border-white/[0.08] opacity-60 hover:opacity-100'
                  } ${isHovered ? 'ring-2 ring-emerald-500/30' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 flex-shrink-0">
                      <FoodImage
                        src={item.image || '/images/food/curry.svg'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <span
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-tl-md"
                        style={{ backgroundColor: color }}
                        title="Box Color"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <h4 className="font-display font-semibold text-sm sm:text-base text-ink-light dark:text-ink-dark truncate">
                          {item.name}
                        </h4>
                        {item.platePosition && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-black/5 dark:bg-white/10 text-ink-muted-light dark:text-ink-muted-dark">
                            {item.platePosition}
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Box #{idx + 1}
                        </span>
                      </div>
                      {item.regionalName && (
                        <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark mt-0.5">
                          {item.regionalName}
                        </p>
                      )}
                      {item.estimatedKcal && (
                        <span className="text-[11px] font-mono text-ink-muted-light dark:text-ink-muted-dark mt-0.5 block">
                          Est. {item.estimatedKcal}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <span className="text-xs font-mono font-bold text-ink-light dark:text-ink-dark">
                      {pct}%
                    </span>
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm'
                          : 'border-2 border-black/30 dark:border-white/30'
                      }`}
                    >
                      {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            candidates.map((cand) => {
              const isSelected = selectedCandidateId === cand.id;
              const pct = Math.round(cand.confidence * 100);

              return (
                <Card
                  key={cand.id}
                  onClick={() => setSelectedCandidateId(cand.id)}
                  padding="sm"
                  className={`cursor-pointer transition-all border-2 flex items-center justify-between ${
                    isSelected
                      ? 'border-brand-light dark:border-brand-dark bg-brand-light/[0.04] dark:bg-brand-dark/[0.08] shadow-soft'
                      : 'border-black/[0.06] dark:border-white/[0.08] hover:border-brand-light/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 flex-shrink-0">
                      <FoodImage
                        src={cand.image || '/images/food/idli.svg'}
                        alt={cand.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-display font-semibold text-sm sm:text-base text-ink-light dark:text-ink-dark truncate">
                        {cand.name}
                      </h4>
                      {cand.regionalName && (
                        <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
                          {cand.regionalName}
                        </p>
                      )}
                      {cand.estimatedKcal && (
                        <span className="text-[11px] font-mono text-ink-muted-light dark:text-ink-muted-dark mt-0.5 block">
                          Est. {cand.estimatedKcal}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <span className="text-xs font-mono font-bold text-ink-light dark:text-ink-dark">
                      {pct}%
                    </span>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected
                          ? 'bg-brand-light dark:bg-brand-dark text-white dark:text-ink-light'
                          : 'border border-black/20 dark:border-white/20'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5 pt-4">
        <Button size="lg" fullWidth onClick={handleConfirm} rightIcon={<ChevronRight className="w-5 h-5" />}>
          {isMultiItem
            ? `Confirm ${selectedItemIds.length} Dishes & Adjust Portions`
            : 'Confirm Dish & Adjust Portion'}
        </Button>

        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/log/photo')}
            leftIcon={<Camera className="w-4 h-4" />}
          >
            Retake Photo
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/log/search')}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Choose Another Dish
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PhotoResultPage;
