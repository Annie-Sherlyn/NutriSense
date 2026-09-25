import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  showKbdHint?: boolean;
  onKbdClick?: () => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search Indian dishes, dosas, snacks…',
  onClear,
  autoFocus = false,
  showKbdHint = false,
  onKbdClick,
  className = '',
}) => {
  return (
    <div
      className={`relative flex items-center w-full rounded-full bg-surface-light dark:bg-surface-dark border border-black/10 dark:border-white/10 shadow-soft focus-within:border-brand-light dark:focus-within:border-brand-dark focus-within:ring-2 focus-within:ring-brand-light/20 transition-all duration-base ${className}`}
    >
      <Search className="w-5 h-5 ml-4 text-ink-muted-light dark:text-ink-muted-dark pointer-events-none flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full py-3 pl-3 pr-10 text-sm bg-transparent text-ink-light dark:text-ink-dark placeholder:text-ink-muted-light dark:placeholder:text-ink-muted-dark focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          className="absolute right-3 p-1 rounded-full text-ink-muted-light hover:text-ink-light dark:text-ink-muted-dark dark:hover:text-ink-dark transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      ) : showKbdHint ? (
        <button
          type="button"
          onClick={onKbdClick}
          className="hidden md:inline-flex items-center gap-1 absolute right-3 px-2 py-0.5 text-[10px] font-semibold text-ink-muted-light dark:text-ink-muted-dark bg-black/5 dark:bg-white/10 rounded border border-black/5 dark:border-white/5"
        >
          <kbd>⌘</kbd>
          <kbd>K</kbd>
        </button>
      ) : null}
    </div>
  );
};
