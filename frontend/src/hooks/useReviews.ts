import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getReviewsByStore,
  getReviewsByListing,
  getReviewsByProduct,
  createReview,
  updateReview,
  deleteReview,
  type ReviewDTO,
} from '@/api/reviews.api'

export type { ReviewDTO }

export function useStoreReviews(storeId?: string) {
  return useQuery({
    queryKey: ['reviews', 'store', storeId],
    queryFn: () => getReviewsByStore(storeId!),
    enabled: !!storeId,
  })
}

export function useListingReviews(listingId?: string) {
  return useQuery({
    queryKey: ['reviews', 'listing', listingId],
    queryFn: () => getReviewsByListing(listingId!),
    enabled: !!listingId,
  })
}

export function useProductReviews(productId?: string) {
  return useQuery({
    queryKey: ['reviews', 'product', productId],
    queryFn: () => getReviewsByProduct(productId!),
    enabled: !!productId,
  })
}

export function useCreateReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { orderItemId: string; rating: number; comment?: string; images?: File[] }) =>
      createReview(args.orderItemId, args),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] })
      qc.invalidateQueries({ queryKey: ['myOrders'] })
    },
  })
}

export function useUpdateReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { reviewId: string; rating: number; comment?: string; images?: File[] }) =>
      updateReview(args.reviewId, args),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export function useDeleteReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}
