import { type ButtonHTMLAttributes, type ReactNode } from 'react'

// ─── Button Component ────────────────────────────────────────────────────────
// PHẢI dùng component này cho mọi nút bấm trong ứng dụng.
// KHÔNG tự ý viết <button className="..."> trong pages hay components khác.

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Kiểu hiển thị nút */
  variant?: ButtonVariant
  /** Kích thước nút */
  size?: ButtonSize
  /** Hiển thị trạng thái đang tải (disabled + spinner) */
  isLoading?: boolean
  /** Icon hiển thị bên trái text */
  leftIcon?: ReactNode
  /** Icon hiển thị bên phải text */
  rightIcon?: ReactNode
  /** Nút chiếm toàn chiều rộng */
  fullWidth?: boolean
  children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-[--color-brand-500] text-[--color-ink-inverse] hover:bg-[--color-brand-600] active:bg-[--color-brand-700] shadow-sm',
  secondary: 'bg-[--color-brand-100] text-[--color-brand-700] hover:bg-[--color-brand-200] active:bg-[--color-brand-300]',
  ghost:     'bg-transparent text-[--color-ink-secondary] hover:bg-[--color-surface-muted] hover:text-[--color-ink-primary]',
  danger:    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm',
  outline:   'bg-transparent border border-[--color-surface-border] text-[--color-ink-primary] hover:bg-[--color-surface-muted]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8  px-3   text-[--text-body-sm]   gap-1.5',
  md: 'h-10 px-4   text-[--text-body-md]   gap-2',
  lg: 'h-12 px-6   text-[--text-body-lg]   gap-2.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <button
      disabled={isDisabled}
      className={[
        // Base styles
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'rounded-[--radius-button] focus-visible:outline-2 focus-visible:outline-[--color-brand-500]',
        'select-none cursor-pointer',
        // Disabled state
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {/* Loading Spinner */}
      {isLoading && (
        <svg
          className="animate-spin shrink-0"
          style={{ width: size === 'sm' ? 14 : size === 'md' ? 16 : 18, height: size === 'sm' ? 14 : size === 'md' ? 16 : 18 }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}

      {/* Left Icon */}
      {!isLoading && leftIcon && (
        <span className="shrink-0" aria-hidden="true">{leftIcon}</span>
      )}

      {/* Label */}
      <span>{children}</span>

      {/* Right Icon */}
      {!isLoading && rightIcon && (
        <span className="shrink-0" aria-hidden="true">{rightIcon}</span>
      )}
    </button>
  )
}
