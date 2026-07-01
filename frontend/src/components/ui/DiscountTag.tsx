import { Tag } from 'lucide-react'
import { formatDiscount } from '@/lib/formatters'

// ─── DiscountTag Component ───────────────────────────────────────────────────
// Hiển thị nhãn phần trăm giảm giá — ví dụ: "−40%"
// Xuất hiện góc trên thẻ sản phẩm (ProductCard).

interface DiscountTagProps {
  /** Phần trăm giảm giá (0–100) */
  percent: number
  /** Kích thước */
  size?: 'sm' | 'md' | 'lg'
  /** Kiểu hiển thị */
  variant?: 'solid' | 'outline'
}

const sizeMap = {
  sm: 'text-[--text-caption]   px-1.5 py-0.5 gap-0.5',
  md: 'text-[--text-body-sm]   px-2   py-1   gap-1',
  lg: 'text-[--text-body-md]   px-2.5 py-1   gap-1',
}

const iconSizeMap = { sm: 10, md: 12, lg: 14 }

export function DiscountTag({ percent, size = 'md', variant = 'solid' }: DiscountTagProps) {
  if (percent <= 0) return null

  return (
    <span
      className={[
        'inline-flex items-center font-bold rounded-md',
        sizeMap[size],
        variant === 'solid'
          ? 'bg-red-500 text-white'
          : 'border border-red-400 text-red-500 bg-red-50',
      ].join(' ')}
      aria-label={`Giảm ${percent}%`}
    >
      <Tag width={iconSizeMap[size]} height={iconSizeMap[size]} aria-hidden="true" />
      {formatDiscount(percent)}
    </span>
  )
}
