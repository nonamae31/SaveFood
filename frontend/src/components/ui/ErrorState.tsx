import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './Button'
import { ApiError } from '@/lib/apiClient'

// ─── ErrorState Component ─────────────────────────────────────────────────────
// Hiển thị khi React Query query bị lỗi.
// Theo SKILL.md: PHẢI dùng ErrorState với nút retry thay vì text lỗi trần.

interface ErrorStateProps {
  /** Error object từ React Query (có thể là ApiError hoặc Error thông thường) */
  error: unknown
  /** Callback khi người dùng bấm "Thử lại" */
  onRetry?: () => void
  /** Tiêu đề lỗi (mặc định tự suy ra từ error) */
  title?: string
}

export function ErrorState({ error, onRetry, title }: ErrorStateProps) {
  // Lấy thông báo lỗi thân thiện cho người dùng
  const getMessage = (): string => {
    const err = error as Error | ApiError | unknown
    if (err instanceof ApiError) {
      if (err.isNotFound) return 'Không tìm thấy nội dung bạn yêu cầu.'
      if (err.isUnauthorized) return 'Bạn cần đăng nhập để xem nội dung này.'
      return err.message
    }
    if (err instanceof Error) return err.message
    return 'Đã xảy ra lỗi không xác định.'
  }

  const err = error as Error | ApiError | unknown
  const displayTitle = title ?? (
    err instanceof ApiError && err.isNotFound
      ? 'Không tìm thấy'
      : 'Đã xảy ra lỗi'
  )

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-[--animate-fade-in]">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
        <AlertTriangle
          width={36}
          height={36}
          strokeWidth={1.5}
          className="text-red-400"
          aria-hidden="true"
        />
      </div>

      {/* Text */}
      <h3 className="text-[--text-heading-sm] font-semibold text-[--color-ink-primary] mb-2">
        {displayTitle}
      </h3>
      <p className="text-[--text-body-sm] text-[--color-ink-secondary] max-w-sm mb-6">
        {getMessage()}
      </p>

      {/* Retry button */}
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          leftIcon={<RefreshCw width={16} height={16} />}
        >
          Thử lại
        </Button>
      )}
    </div>
  )
}
