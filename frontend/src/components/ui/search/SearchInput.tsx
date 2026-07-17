import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onSubmit'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onSubmit?: (value: string) => void;
  variant?: 'header' | 'hero' | 'mobile';
  isDark?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, onSubmit, variant = 'header', isDark, className = '', ...props }, ref) => {
    const isHero = variant === 'hero';
    const isHeader = variant === 'header';

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSubmit) {
        e.preventDefault();
        onSubmit(value);
      }
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    };

    // Container styling depending on variant and dark mode
    const containerClasses = [
      'relative flex items-center w-full transition-all duration-300 rounded-full overflow-hidden border',
      isHero ? 'h-14 shadow-md bg-white border-gray-300 hover:border-gray-400 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200' : 'h-10',
      isHeader && isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 focus-within:bg-white/20 focus-within:border-white/40' : '',
      isHeader && !isDark ? 'bg-gray-100/80 border-transparent hover:bg-gray-100 hover:border-gray-200 focus-within:bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200' : '',
      className
    ].filter(Boolean).join(' ');

    const iconClasses = [
      'flex items-center justify-center transition-colors',
      isHero ? 'pl-5 pr-3 text-gray-400' : 'pl-4 pr-2',
      isHeader && isDark ? 'text-white/70' : '',
      isHeader && !isDark ? 'text-gray-500' : ''
    ].filter(Boolean).join(' ');

    const inputClasses = [
      'flex-1 bg-transparent border-none outline-none w-full transition-colors',
      isHero ? 'text-lg text-gray-800 placeholder-gray-400' : 'text-sm',
      isHeader && isDark ? 'text-white placeholder-white/70' : '',
      isHeader && !isDark ? 'text-gray-900 placeholder-gray-500' : ''
    ].filter(Boolean).join(' ');

    return (
      <div className={containerClasses}>
        <div className={iconClasses}>
          <Search size={isHero ? 24 : 18} />
        </div>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={inputClasses}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className={`flex items-center justify-center transition-colors ${
              isHero ? 'px-5 text-gray-400 hover:text-gray-600' : 
              (isDark ? 'px-4 text-white/70 hover:text-white' : 'px-4 text-gray-400 hover:text-gray-600')
            }`}
          >
            <X size={isHero ? 20 : 16} />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
