import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { IconButton } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal / Bottom Sheet Panel */}
          <motion.div
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`relative z-10 w-full ${maxWidthStyles[maxWidth]} bg-surface-light dark:bg-surface-dark rounded-t-4xl md:rounded-3xl shadow-soft-xl max-h-[90vh] flex flex-col overflow-hidden border border-black/5 dark:border-white/10 pb-safe`}
            role="dialog"
            aria-modal="true"
          >
            {/* Mobile Sheet Handle Bar */}
            <div className="md:hidden flex items-center justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-black/15 dark:bg-white/20" />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div>
                  {typeof title === 'string' ? (
                    <h2 className="text-lg font-bold font-display text-ink-light dark:text-ink-dark">
                      {title}
                    </h2>
                  ) : (
                    title
                  )}
                  {subtitle && (
                    <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <IconButton
                    icon={<X className="w-5 h-5" />}
                    aria-label="Close dialog"
                    onClick={onClose}
                    size="sm"
                  />
                )}
              </div>
            )}

            {/* Scrollable Content */}
            <div className="overflow-y-auto px-6 py-4 flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
