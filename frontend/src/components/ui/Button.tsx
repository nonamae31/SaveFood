import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-button text-body-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand-500 text-surface-base hover:bg-brand-600 active:bg-brand-700',
        secondary: 'bg-surface-muted text-ink-primary hover:bg-surface-border',
        outline: 'border border-surface-border bg-transparent hover:bg-surface-subtle text-ink-primary',
        ghost: 'hover:bg-surface-subtle text-ink-primary',
        danger: 'bg-expiry-urgent text-surface-base hover:bg-red-600',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-9 px-3 text-body-sm',
        lg: 'h-14 px-8 text-heading-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
