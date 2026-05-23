// ─── SkeletonCard Component ──────────────────────────────────────────────────
// Khung xương loading — hiển thị khi đang chờ API trả về dữ liệu.
// Theo SKILL.md: PHẢI dùng SkeletonCard thay vì spinner đơn độc.
// Kích thước khớp với ProductCard để tránh layout shift.

interface SkeletonCardProps {
  /** Số lượng skeleton card hiển thị */
  count?: number
}

function SingleSkeletonCard() {
  return (
    <div
      className="rounded-[--radius-card] bg-[--color-surface-base] shadow-[--shadow-card] overflow-hidden animate-pulse"
      aria-hidden="true"
    >
      {/* Ảnh placeholder */}
      <div className="h-48 bg-[--color-surface-muted]" />

      <div className="p-[--spacing-card-p] space-y-3">
        {/* Tên sản phẩm */}
        <div className="h-4 bg-[--color-surface-muted] rounded-full w-3/4" />
        <div className="h-3 bg-[--color-surface-muted] rounded-full w-1/2" />

        {/* Expiry label */}
        <div className="h-6 bg-[--color-surface-muted] rounded-full w-1/3" />

        {/* Giá */}
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 bg-[--color-surface-muted] rounded-full w-1/3" />
          <div className="h-4 bg-[--color-surface-muted] rounded-full w-1/4" />
        </div>

        {/* Nút */}
        <div className="h-9 bg-[--color-surface-muted] rounded-[--radius-button] w-full mt-2" />
      </div>
    </div>
  )
}

export function SkeletonCard({ count = 1 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SingleSkeletonCard key={i} />
      ))}
    </>
  )
}
