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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSubmit) {
        e.preventDefault();
        onSubmit(value);
      }
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    };

    return (
      <div 
        className={`relative flex items-center w-full transition-all duration-300 bg-white border border-gray-300 rounded-full hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 overflow-hidden ${
          isHero ? 'h-14 shadow-md' : 'h-10'
        } ${className}`}
      >
        <div className={`flex items-center justify-center text-gray-400 ${isHero ? 'pl-5 pr-3' : 'pl-4 pr-2'}`}>
          <Search size={isHero ? 24 : 18} />
        </div>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 w-full ${
            isHero ? 'text-lg' : 'text-sm'
          }`}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className={`flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors ${
              isHero ? 'px-5' : 'px-4'
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
