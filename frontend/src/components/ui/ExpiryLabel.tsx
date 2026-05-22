import { Clock } from 'lucide-react'
import { formatExpiryCountdown, getExpiryStatus } from '@/lib/formatters'
import type { ExpiryStatus } from '@/types/product.types'

// ─── ExpiryLabel Component ───────────────────────────────────────────────────
// Hiển thị đếm ngược thời gian hết hạn với màu sắc cảnh báo tương ứng.
// Đây là component TRUNG TÂM của SaveFood — phải xuất hiện trên mọi thẻ sản phẩm.

const statusStyles: Record<ExpiryStatus, string> = {
  fresh:   'bg-[--color-brand-100]     text-[--color-brand-700]',
  soon:    'bg-amber-100                text-amber-700',
  urgent:  'bg-red-100                  text-[--color-expiry-urgent]  animate-[--animate-pulse-expiry]',
  expired: 'bg-[--color-surface-muted] text-[--color-ink-tertiary]   opacity-70',
}

interface ExpiryLabelProps {
  /** ISO 8601 datetime string của thời điểm hết hạn */
  expiresAt: string
  /** Kích thước badge */
  size?: 'sm' | 'md'
  /** Hiện icon đồng hồ hay không */
  showIcon?: boolean
}

export function ExpiryLabel({ expiresAt, size = 'md', showIcon = true }: ExpiryLabelProps) {
  const status   = getExpiryStatus(expiresAt)
  const label    = formatExpiryCountdown(expiresAt)
  const textSize = size === 'sm' ? 'text-[--text-caption]' : 'text-[--text-body-sm]'
  const iconSize = size === 'sm' ? 12 : 14

  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-[--radius-badge] font-medium whitespace-nowrap',
        textSize,
        statusStyles[status],
      ].join(' ')}
      title={`Hạn sử dụng: ${new Date(expiresAt).toLocaleDateString('vi-VN')}`}
    >
      {showIcon && (
        <Clock
          width={iconSize}
          height={iconSize}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  )
}
