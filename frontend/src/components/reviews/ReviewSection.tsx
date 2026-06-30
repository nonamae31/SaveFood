import { useState } from 'react'
import { Star, User, MessageCircle, ChevronDown, ChevronUp, ImageIcon } from 'lucide-react'
import { useStoreReviews, useCustomerStoreReviewStats, type ReviewDTO, type StoreReviewStatsDTO } from '@/hooks/useReviews'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

dayjs.extend(relativeTime)
dayjs.locale('vi')

/* ─── Star Rating hiển thị ─────────────────────────────────────────────────── */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
        />
      ))}
    </div>
  )
}

/* ─── Review Card ──────────────────────────────────────────────────────────── */
function ReviewCard({ review }: { review: ReviewDTO }) {
  const [showImages, setShowImages] = useState(false)

  return (
    <div className="py-5 border-b border-gray-100 last:border-b-0 animate-[--animate-fade-in]">
      {/* Header: avatar + name + rating + time */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0 overflow-hidden">
          {review.customerAvatar ? (
            <img src={review.customerAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={16} className="text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sm text-gray-900 truncate">
              {review.customerName}
            </span>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {dayjs(review.createdAt.endsWith('Z') ? review.createdAt : review.createdAt + 'Z').fromNow()}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={review.rating} />
            {review.updatedAt && (
              <span className="text-[10px] text-gray-400 italic">(đã sửa)</span>
            )}
          </div>
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="mt-2.5 ml-12 text-sm text-gray-700 leading-relaxed">
          {review.comment}
        </p>
      )}

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="mt-3 ml-12">
          <button
            onClick={() => setShowImages(!showImages)}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 transition-colors mb-2"
          >
            <ImageIcon size={12} />
            {review.images.length} hình ảnh
            {showImages ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showImages && (
            <div className="flex gap-2 flex-wrap animate-[--animate-slide-up]">
              {review.images.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    alt={`Review ${i + 1}`}
                    className="w-20 h-20 rounded-lg object-cover border border-gray-200 hover:border-brand-400 transition-colors cursor-pointer"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Store Reply */}
      {review.storeReply && (
        <div className="mt-3 ml-12 bg-brand-50 border border-brand-100 rounded-xl p-3 animate-[--animate-fade-in]">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageCircle size={12} className="text-brand-600" />
            <span className="text-xs font-bold text-brand-700">Phản hồi từ cửa hàng</span>
            {review.storeReplyAt && (
              <span className="text-[10px] text-brand-400">
                · {dayjs(review.storeReplyAt.endsWith('Z') ? review.storeReplyAt : review.storeReplyAt + 'Z').fromNow()}
              </span>
            )}
          </div>
          <p className="text-sm text-brand-800 leading-relaxed">
            {review.storeReply}
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── Rating Summary Bar ───────────────────────────────────────────────────── */
function RatingSummary({ stats }: { stats?: StoreReviewStatsDTO }) {
  if (!stats || stats.totalReviews === 0) return null

  const total = stats.totalReviews
  const avg = stats.averageRating
  const counts = stats.ratingDistribution || {}

  return (
    <div className="flex items-start gap-6 mb-6 p-4 bg-gray-50 rounded-2xl">
      {/* Average Score */}
      <div className="text-center shrink-0">
        <div className="text-4xl font-bold text-gray-900">{avg.toFixed(1)}</div>
        <StarRating rating={Math.round(avg)} />
        <p className="text-xs text-gray-500 mt-1">{total} đánh giá</p>
      </div>

      {/* Bar chart */}
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map(star => {
          const count = counts[star] || 0
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-gray-500 text-right">{star}</span>
              <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-gray-400 text-right">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Main Component: ReviewSection ────────────────────────────────────────── */
export function ReviewSection({ storeId }: { storeId: string }) {
  const { data: reviews, isLoading, isError } = useStoreReviews(storeId)
  const { data: stats } = useCustomerStoreReviewStats(storeId)
  const [filterStar, setFilterStar] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-red-500 py-4">Không thể tải đánh giá. Vui lòng thử lại.</p>
    )
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-10">
        <Star size={32} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">Chưa có đánh giá nào cho cửa hàng này.</p>
      </div>
    )
  }

  const filtered = filterStar ? reviews.filter(r => r.rating === filterStar) : reviews

  return (
    <div>
      <RatingSummary stats={stats} />

      {/* Star filter chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilterStar(null)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filterStar === null
              ? 'bg-brand-500 text-white border-brand-500'
              : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
            }`}
        >
          Tất cả ({reviews.length})
        </button>
        {[5, 4, 3, 2, 1].map(star => {
          const count = stats?.ratingDistribution?.[star] ?? 0
          if (count === 0) return null
          return (
            <button
              key={star}
              onClick={() => setFilterStar(star)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${filterStar === star
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                }`}
            >
              {star} <Star size={10} className="fill-current" /> ({count})
            </button>
          )
        })}
      </div>

      {/* Review cards */}
      <div>
        {filtered.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {filtered.length === 0 && filterStar && (
        <p className="text-center text-sm text-gray-400 py-6">
          Không có đánh giá {filterStar} sao nào.
        </p>
      )}
    </div>
  )
}
