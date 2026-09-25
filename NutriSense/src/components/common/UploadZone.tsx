import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeBytes?: number; // e.g. 10 * 1024 * 1024
  title?: string;
  subtitle?: string;
  selectedFile?: File | null;
  isLoading?: boolean;
  progressPercent?: number;
  className?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelect,
  accept = 'image/png, image/jpeg, image/webp, application/pdf',
  maxSizeBytes = 10 * 1024 * 1024, // 10MB
  title = 'Drag & drop your file here',
  subtitle = 'Supports PDF, JPG, PNG up to 10MB',
  selectedFile = null,
  isLoading = false,
  progressPercent = 0,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const validateAndProcess = (file: File) => {
    setErrorMsg(null);
    if (file.size > maxSizeBytes) {
      setErrorMsg(`File exceeds maximum size of ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`);
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(e.target.files[0]);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
        animate={{
          scale: isDragOver ? 1.01 : 1,
          borderColor: isDragOver ? '#1F5B45' : undefined,
        }}
        className={`relative flex flex-col items-center justify-center p-8 text-center rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-base ${
          isDragOver
            ? 'bg-brand-light/5 dark:bg-brand-dark/10 border-brand-light dark:border-brand-dark ring-4 ring-brand-light/10 shadow-soft-lg'
            : 'bg-surface-light dark:bg-surface-dark border-black/15 dark:border-white/15 hover:border-brand-light/60 dark:hover:border-brand-dark/60'
        } ${isLoading ? 'pointer-events-none opacity-85' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-light/10 dark:bg-brand-dark/15 text-brand-light dark:text-brand-dark flex items-center justify-center mb-3">
              {selectedFile.type.includes('pdf') ? (
                <FileText className="w-7 h-7" />
              ) : (
                <CheckCircle2 className="w-7 h-7" />
              )}
            </div>
            <p className="text-sm font-semibold text-ink-light dark:text-ink-dark max-w-xs truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark mt-0.5">
              {(selectedFile.size / 1024).toFixed(1)} KB • Click to change file
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-surface-2-light dark:bg-surface-2-dark text-ink-muted-light dark:text-ink-muted-dark flex items-center justify-center mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h4 className="text-sm sm:text-base font-semibold text-ink-light dark:text-ink-dark">
              {title}
            </h4>
            <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark mt-1">
              {subtitle}
            </p>
          </div>
        )}

        {/* Loading progress bar */}
        {isLoading && (
          <div className="w-full max-w-xs mt-4">
            <div className="flex justify-between text-xs font-medium text-ink-muted-light dark:text-ink-muted-dark mb-1">
              <span>Reading document…</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-brand-light dark:bg-brand-dark rounded-full"
                animate={{ width: `${progressPercent}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {errorMsg && (
        <p className="text-xs text-rose-500 font-medium mt-2 text-center">{errorMsg}</p>
      )}
    </div>
  );
};
