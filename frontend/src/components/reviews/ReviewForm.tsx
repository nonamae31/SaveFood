import { useState, useRef } from 'react'
import { Star, X, Upload, Loader2 } from 'lucide-react'
import { useCreateReview, useUpdateReview, useDeleteReview, type ReviewDTO } from '@/hooks/useReviews'

interface ReviewFormProps {
  orderItemId: string
  orderItemTitle: string
  existingReview?: ReviewDTO | null
  onClose: () => void
  onSuccess?: () => void
}

export function ReviewForm({ orderItemId, orderItemTitle, existingReview, onClose, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState(existingReview?.comment ?? '')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>(existingReview?.images ?? [])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createMutation = useCreateReview()
  const updateMutation = useUpdateReview()
  const deleteMutation = useDeleteReview()

  const isEditing = !!existingReview
  const isPending = createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const total = images.length + files.length
    if (total > 5) {
      alert('Chỉ được phép tải lên tối đa 5 hình ảnh.')
      return
    }
    setImages(prev => [...prev, ...files])
    // Create local preview URLs
    const newPreviews = files.map(f => URL.createObjectURL(f))
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index))
    // If we're removing newly-added files, adjust the images array
    if (isEditing) {
      const existingCount = existingReview?.images?.length ?? 0
      if (index >= existingCount) {
        setImages(prev => prev.filter((_, i) => i !== (index - existingCount)))
      }
    } else {
      setImages(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      alert('Vui lòng chọn số sao đánh giá.')
      return
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          reviewId: existingReview!.id,
          rating,
          comment: comment || undefined,
          images: images.length > 0 ? images : undefined,
        })
      } else {
        await createMutation.mutateAsync({
          orderItemId,
          rating,
          comment: comment || undefined,
          images: images.length > 0 ? images : undefined,
        })
      }
      onSuccess?.()
      onClose()
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
    }
  }

  const handleDelete = async () => {
    if (!existingReview) return
    if (!window.confirm('Xoá đánh giá này? Bạn sẽ không thể viết lại đánh giá cho sản phẩm này.')) return

    try {
      await deleteMutation.mutateAsync(existingReview.id)
      onSuccess?.()
      onClose()
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra khi xoá đánh giá.')
    }
  }

  const activeRating = hoverRating || rating
  const ratingLabels = ['', 'Tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-[--animate-fade-in]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-[--animate-slide-up]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {isEditing ? 'Sửa đánh giá' : 'Đánh giá sản phẩm'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Product name */}
          <p className="text-sm text-gray-600 font-medium bg-gray-50 rounded-xl px-4 py-2.5">
            {orderItemTitle}
          </p>

          {/* Star Rating Picker */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-125"
                >
                  <Star
                    size={32}
                    className={`transition-colors ${
                      i <= activeRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200 hover:text-amber-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            {activeRating > 0 && (
              <span className="text-sm font-medium text-amber-600 animate-[--animate-fade-in]">
                {ratingLabels[activeRating]}
              </span>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nhận xét <span className="text-gray-400 font-normal">(không bắt buộc)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              maxLength={1000}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all resize-none text-sm"
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
            />
            <p className="text-right text-xs text-gray-400 mt-0.5">{comment.length}/1000</p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh <span className="text-gray-400 font-normal">(tối đa 5 ảnh)</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {previews.map((url, i) => (
                <div key={i} className="relative group">
                  <img
                    src={url}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {previews.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 hover:border-brand-400 flex items-center justify-center text-gray-400 hover:text-brand-500 transition-colors"
                >
                  <Upload size={18} />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Đang xoá...' : 'Xoá'}
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isPending || rating === 0}
              className="px-5 py-2.5 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isEditing ? 'Cập nhật' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
