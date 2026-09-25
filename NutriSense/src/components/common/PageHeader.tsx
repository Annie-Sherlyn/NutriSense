import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from './Button';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <div className={`flex items-start justify-between gap-4 mb-6 ${className}`}>
      <div className="flex items-start gap-3">
        {showBack && (
          <IconButton
            icon={<ArrowLeft className="w-5 h-5" />}
            aria-label="Go back"
            onClick={handleBack}
            size="sm"
            className="mt-0.5"
          />
        )}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink-light dark:text-ink-dark">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
    </div>
  );
};
