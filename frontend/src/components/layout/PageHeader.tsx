import type { ReactNode } from 'react'

// ─── PageHeader Component ─────────────────────────────────────────────────────
// Tiêu đề trang nhất quán — mọi trang phải dùng component này.
// Theo SKILL.md: "visual inconsistency across pages is a bug, not a style preference"

interface PageHeaderProps {
  /** Tiêu đề chính của trang */
  title: string
  /** Mô tả phụ (optional) */
  subtitle?: string
  /** Phần tử action bên phải (ví dụ: nút tạo mới) */
  action?: ReactNode
  /** Breadcrumb navigation (optional) */
  breadcrumb?: ReactNode
}

export function PageHeader({ title, subtitle, action, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-8 animate-[--animate-fade-in]">
      {/* Breadcrumb */}
      {breadcrumb && (
        <nav aria-label="Breadcrumb" className="mb-3 text-[--text-caption] text-[--color-ink-tertiary]">
          {breadcrumb}
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          {/* Tiêu đề — dùng h1, chỉ 1 h1 mỗi trang theo SEO guidelines */}
          <h1 className="text-[--text-heading-xl] font-bold text-[--color-ink-primary] font-[--font-display] leading-tight">
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="mt-1.5 text-[--text-body-md] text-[--color-ink-secondary]">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action (ví dụ: nút "Thêm tin đăng") */}
        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
