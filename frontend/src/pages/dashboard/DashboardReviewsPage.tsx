import { useState } from 'react'
import {
  Star, MessageSquare, Send, Loader2, AlertCircle,
  Search, Filter, ThumbsUp, MessageCircle
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { useAuthContext } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/apiClient'
import { useMyStoreReviewStats } from '@/hooks/useReviews'
import type { ReviewDTO } from '@/api/reviews.api'

// ─── Store Reviews API calls ──────────────────────────────────────────────────

function getStoreReviews(): Promise<ReviewDTO[]> {
  return apiClient<ReviewDTO[]>(`/store/reviews`)
}

function replyToReview(
  reviewId: string,
  replyText: string
): Promise<ReviewDTO> {
  return apiClient<ReviewDTO>(`/store/reviews/${reviewId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ replyText }),
  })
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useStoreReviews(storeId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.reviews.byStore(storeId),
    queryFn: () => getStoreReviews(),
    enabled: !!storeId,
  })
}

function useReplyToReview(storeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, replyText }: { reviewId: string; replyText: string }) =>
      replyToReview(reviewId, replyText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reviews.byStore(storeId) })
    },
  })
}

// ─── StarRating ───────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </div>
  )
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────

function ReviewCard({ review, storeId }: { review: ReviewDTO; storeId: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [replyText, setReplyText] = useState(review.storeReply ?? '')
  const [isEditing, setIsEditing] = useState(false)
  const replyMutation = useReplyToReview(storeId)

  const handleReply = async () => {
    if (!replyText.trim()) return
    await replyMutation.mutateAsync({ reviewId: review.id, replyText: replyText.trim() })
    setIsEditing(false)
    setIsExpanded(false)
  }

  const avatarLetter = review.customerName?.charAt(0).toUpperCase() || 'K'

  const relativeDate = (dateStr: string) => {
    const utcDateStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z'
    const diff = Date.now() - new Date(utcDateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days <= 0) return 'Hôm nay'
    if (days === 1) return 'Hôm qua'
    if (days < 30) return `${days} ngày trước`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months} tháng trước`
    return new Date(utcDateStr).toLocaleDateString('vi-VN')
  }

  const showReplyBox = isExpanded || isEditing

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
            {review.customerAvatar
              ? <img src={review.customerAvatar} alt={review.customerName} className="w-full h-full object-cover" />
              : avatarLetter
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm">{review.customerName}</span>
              <span className="text-xs text-gray-400">{relativeDate(review.createdAt)}</span>
              {review.updatedAt && <span className="text-xs text-gray-400 italic">(đã chỉnh sửa)</span>}
              {review.sentimentLabel && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  review.sentimentLabel === 'Positive' ? 'bg-green-100 text-green-700 border border-green-200' :
                  review.sentimentLabel === 'Negative' ? 'bg-red-100 text-red-700 border border-red-200' :
                  'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {review.sentimentLabel === 'Positive' ? 'Tích cực' : review.sentimentLabel === 'Negative' ? 'Tiêu cực' : 'Trung tính'}
                </span>
              )}
            </div>
            <div className="mt-1"><StarRating rating={review.rating} /></div>
          </div>

          {/* Rating badge */}
          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
            ${review.rating >= 4 ? 'bg-green-50 text-green-600' :
              review.rating === 3 ? 'bg-amber-50 text-amber-600' :
                'bg-red-50 text-red-600'}`}>
            {review.rating}
          </div>
        </div>

        {/* Comment */}
        {review.comment && (
          <p className="mt-3 text-sm text-gray-700 leading-relaxed">{review.comment}</p>
        )}

        {/* Images */}
        {review.images.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {review.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Ảnh ${i + 1}`}
                className="w-16 h-16 rounded-lg object-cover border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(img, '_blank')}
              />
            ))}
          </div>
        )}

        {/* Existing reply */}
        {review.storeReply && !isEditing && (
          <div className="mt-4 bg-brand-50 border border-brand-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-semibold text-brand-700">Phản hồi của cửa hàng</span>
              {review.storeReplyAt && (
                <span className="text-xs text-gray-400 ml-auto">{relativeDate(review.storeReplyAt)}</span>
              )}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{review.storeReply}</p>
            <button
              onClick={() => { setIsEditing(true); setReplyText(review.storeReply ?? '') }}
              className="mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              Chỉnh sửa phản hồi
            </button>
          </div>
        )}
      </div>

      {/* Reply button / box */}
      <div className="border-t border-gray-50">
        {!review.storeReply && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm text-brand-600 hover:bg-brand-50 transition-colors font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            Phản hồi đánh giá
          </button>
        )}

        {showReplyBox && (
          <div className="px-5 py-4 bg-gray-50">
            <label className="text-xs font-semibold text-gray-600 mb-2 block">
              {isEditing ? 'Chỉnh sửa phản hồi' : 'Viết phản hồi của bạn'}
            </label>
            <div className="flex gap-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Cảm ơn quý khách đã đánh giá! Chúng tôi..."
                rows={3}
                maxLength={1000}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 bg-white placeholder-gray-400"
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || replyMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {replyMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                  Gửi
                </button>
                <button
                  onClick={() => { setIsExpanded(false); setIsEditing(false); setReplyText(review.storeReply ?? '') }}
                  className="px-4 py-2 text-gray-500 text-sm rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{replyText.length}/1000 ký tự</p>
            {replyMutation.isError && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Gửi phản hồi thất bại. Vui lòng thử lại.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardReviewsPage() {
  const { user } = useAuthContext()
  const storeId = user?.storeId ?? ''
  const { data: reviews = [], isLoading, isError } = useStoreReviews(storeId)
  const { data: stats, isLoading: isStatsLoading } = useMyStoreReviewStats()

  const [search, setSearch] = useState('')
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [filterReplied, setFilterReplied] = useState<'all' | 'replied' | 'pending'>('all')

  // Stats from backend
  const totalReviews = stats?.totalReviews ?? 0
  const avgRating = totalReviews > 0 ? (stats?.averageRating?.toFixed(1) ?? '—') : '—'
  const pendingReply = stats?.pendingReply ?? 0
  const highRated = stats?.highRated ?? 0

  // Filter + sort
  const filtered = reviews
    .filter(r => {
      const matchSearch = !search ||
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (r.comment?.toLowerCase().includes(search.toLowerCase()) ?? false)
      const matchRating = filterRating === null || r.rating === filterRating
      const matchReplied =
        filterReplied === 'all' ||
        (filterReplied === 'replied' && !!r.storeReply) ||
        (filterReplied === 'pending' && !r.storeReply)
      return matchSearch && matchRating && matchReplied
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-display">Đánh giá của khách hàng</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý và phản hồi các đánh giá từ khách hàng</p>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Tổng đánh giá" value={totalReviews} icon={MessageSquare} color="bg-blue-50 text-blue-600" />
          <StatCard label="Điểm trung bình" value={avgRating} icon={Star} color="bg-amber-50 text-amber-600" />
          <StatCard label="Chờ phản hồi" value={pendingReply} icon={AlertCircle} color="bg-red-50 text-red-500" />
          <StatCard label="Đánh giá tích cực" value={highRated} icon={ThumbsUp} color="bg-green-50 text-green-600" />
        </div>
      )}

      {/* Rating Distribution */}
      {!isStatsLoading && totalReviews > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Phân bố đánh giá</h2>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => {
              const count = stats?.ratingDistribution?.[star] ?? 0
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0
              return (
                <button
                  key={star}
                  onClick={() => setFilterRating(filterRating === star ? null : star)}
                  className={`w-full flex items-center gap-3 rounded-lg px-2 py-1 transition-colors ${filterRating === star ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-1 w-16 shrink-0">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-gray-600 font-medium">{star} sao</span>
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right shrink-0">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên khách hoặc nội dung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={filterReplied}
            onChange={(e) => setFilterReplied(e.target.value as 'all' | 'replied' | 'pending')}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white text-gray-700"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chưa phản hồi</option>
            <option value="replied">Đã phản hồi</option>
          </select>
          {filterRating !== null && (
            <button
              onClick={() => setFilterRating(null)}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap"
            >
              ✕ Xóa lọc ★{filterRating}
            </button>
          )}
        </div>
      </div>

      {/* Content states */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
          <p className="text-gray-600 font-medium">Không thể tải đánh giá</p>
          <p className="text-sm text-gray-400 mt-1">Vui lòng thử làm mới trang</p>
        </div>
      )}

      {!isLoading && !isError && totalReviews === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
            <Star className="w-8 h-8 text-brand-400" />
          </div>
          <p className="text-gray-700 font-semibold">Chưa có đánh giá nào</p>
          <p className="text-sm text-gray-400 mt-1">Khi khách hàng gửi đánh giá, chúng sẽ xuất hiện tại đây</p>
        </div>
      )}

      {!isLoading && !isError && totalReviews > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500">Không tìm thấy đánh giá nào khớp với bộ lọc</p>
          <button
            onClick={() => { setSearch(''); setFilterRating(null); setFilterReplied('all') }}
            className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Xóa tất cả bộ lọc
          </button>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400">Hiển thị {filtered.length} / {totalReviews} đánh giá</p>
          {filtered.map((review) => (
            <ReviewCard key={review.id} review={review} storeId={storeId} />
          ))}
        </div>
      )}
    </div>
  )
}
