import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastContextType {
  showToast: (item: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, message, actionLabel, onAction, durationMs = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      setToasts((prev) => [...prev, { id, type, message, actionLabel, onAction, durationMs }]);

      if (durationMs > 0) {
        setTimeout(() => removeToast(id), durationMs);
      }
    },
    [removeToast]
  );

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-20 md:bottom-6 right-0 md:right-6 z-50 flex flex-col gap-2 p-4 max-w-sm w-full pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-surface-light dark:bg-surface-dark border border-black/10 dark:border-white/10 shadow-soft-lg text-sm text-ink-light dark:text-ink-dark"
            >
              {getIcon(toast.type)}
              <div className="flex-1 text-xs sm:text-sm font-medium leading-snug">
                {toast.message}
                {toast.actionLabel && toast.onAction && (
                  <button
                    onClick={() => {
                      toast.onAction?.();
                      removeToast(toast.id);
                    }}
                    className="block mt-1 font-semibold text-brand-light dark:text-brand-dark underline underline-offset-2"
                  >
                    {toast.actionLabel}
                  </button>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-ink-muted-light hover:text-ink-light dark:text-ink-muted-dark dark:hover:text-ink-dark p-0.5 rounded-full"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
