import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-body-sm font-medium text-ink-primary"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'flex h-11 w-full rounded-input border border-surface-border bg-surface-base px-3 py-2 text-body-md transition-colors',
            'file:border-0 file:bg-transparent file:text-body-sm file:font-medium',
            'placeholder:text-ink-tertiary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-expiry-urgent focus-visible:ring-expiry-urgent',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-caption text-expiry-urgent">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
