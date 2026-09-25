import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { UploadZone } from '../../components/common/UploadZone';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { NutriMote } from '../../components/animations/NutriMote';
import { reportService } from '../../services/report.service';
import { useApp } from '../../context/AppContext';
import type { LabReport } from '../../types';

export const ReportUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateProfile } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reportResult, setReportResult] = useState<LabReport | null>(null);

  const handleFileSelect = async (selected: File) => {
    setFile(selected);
    setIsLoading(true);
    setProgress(15);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 200);

    try {
      const parsed = await reportService.analyze(selected);
      clearInterval(progressInterval);
      setProgress(100);
      setReportResult(parsed);

      updateProfile({
        hasUploadedReport: true,
        reportSummary: 'Report analyzed for dietary nutrient indicators.',
      });
    } catch (err) {
      clearInterval(progressInterval);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/onboarding/confirm');
  };

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-ink-light dark:text-ink-dark p-6 sm:p-10 transition-colors">
      <div className="max-w-xl mx-auto w-full pt-safe">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-brand-light dark:text-brand-dark uppercase tracking-wider">
            Step 4 of 6 (Optional Report)
          </span>
          <button
            onClick={handleContinue}
            className="text-xs font-semibold text-ink-muted-light hover:text-ink-light dark:text-ink-muted-dark dark:hover:text-ink-dark"
          >
            Skip this step
          </button>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink-light dark:text-ink-dark mb-1">
          Upload Health-Test Report
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mb-6">
          Upload your blood test or vitamin panel to tailor nutrient priorities automatically.
        </p>

        {/* Upload Zone */}
        {!reportResult && (
          <UploadZone
            onFileSelect={handleFileSelect}
            selectedFile={file}
            isLoading={isLoading}
            progressPercent={progress}
            title="Upload CBC or Vitamin Panel PDF / Photo"
            subtitle="Drag & drop or tap to browse (PDF, JPG, PNG up to 10MB)"
          />
        )}

        {/* Parsed Result State */}
        {reportResult && (
          <div className="flex flex-col gap-4">
            <Card padding="md" className="border-2 border-brand-light/30 dark:border-brand-dark/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-light/10 dark:bg-brand-dark/15 text-brand-light dark:text-brand-dark flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-ink-light dark:text-ink-dark">
                    Report Read Successfully
                  </h3>
                  <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
                    {reportResult.fileName}
                  </p>
                </div>
              </div>

              {/* Strict Non-Negotiable Copy */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2 mb-4 leading-relaxed">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Potential nutrient-related information found in uploaded report. Backend analysis will be connected later. NutriSense does not provide a diagnosis.
                </span>
              </div>

              {/* Indicators preview */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider">
                  Relevant Dietary Indicators Found
                </span>
                {reportResult.indicators.map((ind, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-2.5 rounded-xl bg-surface-2-light dark:bg-surface-2-dark text-xs"
                  >
                    <div>
                      <span className="font-bold text-ink-light dark:text-ink-dark">
                        {ind.name}
                      </span>
                      <p className="text-[11px] text-ink-muted-light dark:text-ink-muted-dark mt-0.5">
                        {ind.note}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex-shrink-0 ${
                        ind.status === 'low'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {ind.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Button size="lg" fullWidth onClick={handleContinue} className="mt-4">
              Continue with Detected Insights
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 mt-8 text-xs text-ink-muted-light dark:text-ink-muted-dark justify-center">
          <NutriMote type="calcium" mood="idle" size={24} />
          <span>Files are parsed client-side for demonstration. No records are sent to 3rd parties.</span>
        </div>
      </div>
    </div>
  );
};

export default ReportUploadPage;
