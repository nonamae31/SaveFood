import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const inputId = id || React.useId();
    const [showPassword, setShowPassword] = React.useState(false);

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

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
        <div className="relative">
          <input
            id={inputId}
            type={inputType}
            className={cn(
              'flex h-11 w-full rounded-input border border-surface-border bg-surface-base px-3 py-2 text-body-md transition-colors',
              'file:border-0 file:bg-transparent file:text-body-sm file:font-medium',
              'placeholder:text-ink-tertiary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-expiry-urgent focus-visible:ring-expiry-urgent',
              isPassword && 'pr-10', // padding right for the eye icon
              className
            )}
            ref={ref}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-secondary hover:text-ink-primary"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
        {error && (
          <p className="text-caption text-expiry-urgent" aria-live="polite">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
