// ─── API: Customer Reviews ──────────────────────────────────────────────────
// Gọi các endpoint từ Customer/ReviewsController:
//   GET  /api/customer/reviews/store/{storeId}     — reviews theo cửa hàng
//   GET  /api/customer/reviews/listing/{listingId} — reviews theo listing
//   GET  /api/customer/reviews/product/{productId} — reviews theo product
//   POST /api/customer/reviews/{orderItemId}       — tạo review (FormData)
//   PUT  /api/customer/reviews/{reviewId}          — sửa review (FormData)
//   DELETE /api/customer/reviews/{reviewId}        — xoá review

import { apiClient } from '@/lib/apiClient'

export interface ReviewDTO {
  id: string
  orderItemId: string
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string | null
  storeReply: string | null
  storeReplyAt: string | null
  images: string[]
  customerName: string
  customerAvatar: string | null
}

/** GET reviews theo store */
export function getReviewsByStore(storeId: string): Promise<ReviewDTO[]> {
  return apiClient<ReviewDTO[]>(`/customer/reviews/store/${storeId}`)
}

/** GET reviews theo listing */
export function getReviewsByListing(listingId: string): Promise<ReviewDTO[]> {
  return apiClient<ReviewDTO[]>(`/customer/reviews/listing/${listingId}`)
}

/** GET reviews theo product */
export function getReviewsByProduct(productId: string): Promise<ReviewDTO[]> {
  return apiClient<ReviewDTO[]>(`/customer/reviews/product/${productId}`)
}

/** POST tạo review mới (FormData vì có images) */
export function createReview(orderItemId: string, data: { rating: number; comment?: string; images?: File[] }): Promise<ReviewDTO> {
  const formData = new FormData()
  formData.append('Rating', String(data.rating))
  if (data.comment) formData.append('Comment', data.comment)
  if (data.images) {
    data.images.forEach(img => formData.append('Images', img))
  }
  return apiClient<ReviewDTO>(`/customer/reviews/${orderItemId}`, {
    method: 'POST',
    headers: { 'Content-Type': '' },
    body: formData,
  })
}

/** PUT sửa review (FormData vì có images) */
export function updateReview(reviewId: string, data: { rating: number; comment?: string; images?: File[] }): Promise<ReviewDTO> {
  const formData = new FormData()
  formData.append('Rating', String(data.rating))
  if (data.comment) formData.append('Comment', data.comment)
  if (data.images) {
    data.images.forEach(img => formData.append('Images', img))
  }
  return apiClient<ReviewDTO>(`/customer/reviews/${reviewId}`, {
    method: 'PUT',
    headers: { 'Content-Type': '' },
    body: formData,
  })
}

/** DELETE xoá review (soft delete, không cho viết lại) */
export function deleteReview(reviewId: string): Promise<void> {
  return apiClient<void>(`/customer/reviews/${reviewId}`, {
    method: 'DELETE',
  })
}
