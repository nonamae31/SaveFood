import { PackageSearch, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// ─── EmptyState Component ────────────────────────────────────────────────────
// Hiển thị khi API trả về danh sách rỗng hoặc không có kết quả tìm kiếm.
// Theo SKILL.md: PHẢI dùng EmptyState, không dùng text trần.

interface EmptyStateProps {
  /** Icon Lucide hiển thị (mặc định: PackageSearch) */
  icon?: LucideIcon
  /** Tiêu đề chính */
  title?: string
  /** Mô tả chi tiết */
  description?: string
  /** Nút action (tùy chọn) */
  action?: ReactNode
}

export function EmptyState({
  icon: Icon = PackageSearch,
  title = 'Không có kết quả',
  description = 'Hiện tại chưa có dữ liệu để hiển thị.',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-[--animate-fade-in]">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-[--color-surface-muted] flex items-center justify-center mb-5">
        <Icon
          width={36}
          height={36}
          strokeWidth={1.5}
          className="text-[--color-ink-tertiary]"
          aria-hidden="true"
        />
      </div>

      {/* Text */}
      <h3 className="text-[--text-heading-sm] font-semibold text-[--color-ink-primary] mb-2">
        {title}
      </h3>
      <p className="text-[--text-body-sm] text-[--color-ink-secondary] max-w-sm">
        {description}
      </p>

      {/* Action Button */}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
