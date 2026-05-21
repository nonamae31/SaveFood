# SaveFood — Atomic Component Reference

## Button

```tsx
// src/components/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize    = 'sm' | 'md' | 'lg'

const variantMap: Record<ButtonVariant, string> = {
  primary:   'bg-brand-500 text-ink-inverse hover:bg-brand-600 active:bg-brand-700 shadow-sm',
  secondary: 'bg-brand-100 text-brand-700 hover:bg-brand-200 active:bg-brand-300',
  ghost:     'bg-transparent text-ink-secondary hover:bg-surface-muted active:bg-surface-border',
  danger:    'bg-red-500 text-ink-inverse hover:bg-red-600 active:bg-red-700',
  outline:   'border border-surface-border text-ink-primary hover:bg-surface-muted bg-transparent',
}

const sizeMap: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-body-sm rounded-button',
  md: 'px-4 py-2   text-body-md rounded-button',
  lg: 'px-6 py-3   text-body-lg rounded-button',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant
  size?:     ButtonSize
  loading?:  boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantMap[variant]} ${sizeMap[size]} ${className}
      `}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
}
```

---

## Badge

```tsx
// src/components/ui/Badge.tsx
type BadgeVariant = 'brand' | 'amber' | 'red' | 'gray' | 'blue'

const badgeVariants: Record<BadgeVariant, string> = {
  brand: 'bg-brand-100 text-brand-700',
  amber: 'bg-amber-100 text-amber-700',
  red:   'bg-red-100   text-red-700',
  gray:  'bg-surface-muted text-ink-secondary',
  blue:  'bg-blue-100  text-blue-700',
}

interface BadgeProps {
  label:    string
  variant?: BadgeVariant
  icon?:    ReactNode
}

export function Badge({ label, variant = 'gray', icon }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-badge text-caption font-medium ${badgeVariants[variant]}`}>
      {icon}
      {label}
    </span>
  )
}
```

---

## DiscountTag

```tsx
// src/components/ui/DiscountTag.tsx
import { formatDiscount } from '@/lib/formatters'

interface DiscountTagProps {
  percent:  number
  size?:    'sm' | 'md'
}

export function DiscountTag({ percent, size = 'md' }: DiscountTagProps) {
  const textSize = size === 'sm' ? 'text-caption' : 'text-body-sm'
  return (
    <span className={`inline-flex items-center bg-expiry-urgent text-ink-inverse font-bold ${textSize} px-2 py-0.5 rounded-badge`}>
      {formatDiscount(percent)}
    </span>
  )
}
```

---

## ProductCard

```tsx
// src/components/products/ProductCard.tsx
import { ShoppingCart, Store } from 'lucide-react'
import { ExpiryLabel } from '@/components/ui/ExpiryLabel'
import { DiscountTag } from '@/components/ui/DiscountTag'
import { Button } from '@/components/ui/Button'
import { formatVND } from '@/lib/formatters'
import type { Product } from '@/types/product.types'

interface ProductCardProps {
  product:     Product
  onAddToCart: (productId: string) => void
  variant?:    'grid' | 'list'
}

export function ProductCard({ product, onAddToCart, variant = 'grid' }: ProductCardProps) {
  const isSoldOut = product.quantityLeft === 0 || !product.isAvailable

  return (
    <article className="bg-surface-base rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden group animate-fade-in">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
        <img
          src={product.imageUrls[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 left-2">
          <DiscountTag percent={product.discountPercent} />
        </div>
        <div className="absolute top-2 right-2">
          <ExpiryLabel expiresAt={product.expiresAt} size="sm" />
        </div>
        {isSoldOut && (
          <div className="absolute inset-0 bg-ink-primary/50 flex items-center justify-center">
            <span className="text-ink-inverse font-semibold text-body-md">Hết hàng</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-card-p flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-heading-sm text-ink-primary line-clamp-2 flex-1">{product.name}</h3>
        </div>

        <div className="flex items-center gap-1.5 text-body-sm text-ink-secondary">
          <Store className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span className="truncate">{product.storeName}</span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div>
            <p className="text-heading-md text-brand-600 font-bold">{formatVND(product.discountedPrice)}</p>
            <p className="text-caption text-ink-tertiary line-through">{formatVND(product.originalPrice)}</p>
          </div>
          <p className="text-caption text-ink-tertiary">Còn {product.quantityLeft}</p>
        </div>

        <Button
          variant="primary"
          size="sm"
          disabled={isSoldOut}
          leftIcon={<ShoppingCart className="w-3.5 h-3.5" aria-hidden />}
          onClick={() => onAddToCart(product.id)}
          className="w-full mt-1"
        >
          {isSoldOut ? 'Hết hàng' : 'Thêm vào giỏ'}
        </Button>
      </div>
    </article>
  )
}
```

---

## SkeletonCard

```tsx
// src/components/ui/SkeletonCard.tsx
// Mirrors ProductCard layout — use in loading grids

export function SkeletonCard() {
  return (
    <div className="bg-surface-base rounded-card shadow-card overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-surface-muted" />
      <div className="p-card-p flex flex-col gap-3">
        <div className="h-4 bg-surface-muted rounded w-3/4" />
        <div className="h-3 bg-surface-muted rounded w-1/2" />
        <div className="h-5 bg-surface-muted rounded w-1/3 mt-1" />
        <div className="h-9 bg-surface-muted rounded-button mt-1" />
      </div>
    </div>
  )
}
```

---

## EmptyState

```tsx
// src/components/ui/EmptyState.tsx
import type { ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?:         ReactNode
  title:         string
  description?:  string
  action?:       { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
      {icon && <div className="text-ink-tertiary opacity-50">{icon}</div>}
      <div>
        <p className="text-heading-md text-ink-primary">{title}</p>
        {description && <p className="text-body-md text-ink-secondary mt-1">{description}</p>}
      </div>
      {action && (
        <Button variant="outline" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
```

---

## ErrorState

```tsx
// src/components/ui/ErrorState.tsx
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import type { ApiError } from '@/types/api.types'

interface ErrorStateProps {
  error?:    ApiError | Error | null
  onRetry?:  () => void
  message?:  string
}

export function ErrorState({ error, onRetry, message }: ErrorStateProps) {
  const msg = message ?? (error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.')
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
      <AlertTriangle className="w-10 h-10 text-expiry-urgent" aria-hidden />
      <p className="text-heading-sm text-ink-primary">{msg}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>Thử lại</Button>
      )}
    </div>
  )
}
```
