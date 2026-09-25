import React, { useState } from 'react';

interface FoodImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  fallbackText?: string;
}

export const FoodImage: React.FC<FoodImageProps> = ({
  src,
  alt,
  className = '',
  width = '100%',
  height = '100%',
  fallbackText,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const initial = fallbackText ? fallbackText.charAt(0).toUpperCase() : alt.charAt(0).toUpperCase() || 'N';

  if (hasError || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-2-light dark:bg-surface-2-dark text-brand-light dark:text-brand-dark font-display font-bold text-xl select-none border border-black/5 dark:border-white/5 rounded-2xl ${className}`}
        style={{ width, height }}
      >
        <span>{initial}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-black/5 dark:bg-white/5 animate-pulse rounded-2xl" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        width={typeof width === 'number' ? width : 120}
        height={typeof height === 'number' ? height : 120}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
};
