import { type InputHTMLAttributes, type ReactNode, useId } from 'react'

// ─── Input Component ─────────────────────────────────────────────────────────
// Ô nhập liệu chuẩn với label, error message và icon support.
// PHẢI dùng component này cho mọi input trong form.

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label hiển thị phía trên input */
  label?: string
  /** Thông báo lỗi (hiển thị màu đỏ phía dưới) */
  error?: string
  /** Gợi ý hiển thị phía dưới (khi không có error) */
  hint?: string
  /** Icon ở bên trái */
  leftIcon?: ReactNode
  /** Icon ở bên phải (ví dụ: icon show/hide password) */
  rightIcon?: ReactNode
  /** Nếu true, input chiếm toàn chiều rộng */
  fullWidth?: boolean
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  fullWidth = true,
  id: externalId,
  className = '',
  disabled,
  ...props
}: InputProps) {
  const generatedId = useId()
  const id = externalId ?? generatedId

  return (
    <div className={['flex flex-col gap-1.5', fullWidth ? 'w-full' : ''].join(' ')}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="text-[--text-body-sm] font-medium text-[--color-ink-primary] select-none"
        >
          {label}
          {props.required && (
            <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
          )}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative flex items-center">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 text-[--color-ink-tertiary] pointer-events-none" aria-hidden="true">
            {leftIcon}
          </div>
        )}

        <input
          id={id}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={[
            // Base styles
            'w-full rounded-[--radius-input] border bg-[--color-surface-base] text-[--text-body-md]',
            'text-[--color-ink-primary] placeholder:text-[--color-ink-tertiary]',
            'transition-all duration-150 outline-none',
            // Padding (adjust for icons)
            leftIcon  ? 'pl-10 pr-3' : 'px-3',
            rightIcon ? 'pr-10 pl-3' : '',
            !leftIcon && !rightIcon ? 'px-3' : '',
            'py-2 h-10',
            // Border colors
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-[--color-surface-border] focus:border-[--color-brand-500] focus:ring-2 focus:ring-[--color-brand-100]',
            // Disabled state
            disabled ? 'bg-[--color-surface-muted] cursor-not-allowed opacity-60' : '',
            className,
          ].filter(Boolean).join(' ')}
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute right-3 text-[--color-ink-tertiary]">
            {rightIcon}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[--text-caption] text-red-500 flex items-center gap-1">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}

      {/* Hint message (chỉ hiện khi không có error) */}
      {!error && hint && (
        <p id={`${id}-hint`} className="text-[--text-caption] text-[--color-ink-tertiary]">
          {hint}
        </p>
      )}
    </div>
  )
}
