// ─── Hooks: Clearance Listings (React Query) ────────────────────────────────

import { useQuery } from '@tanstack/react-query'
import { getListings, getRecommendations } from '@/api/listings.api'
import type { ListingFilter } from '@/types/listing.types'

// ── Query Keys ────────────────────────────────────────────────────────────────

export const LISTING_QUERY_KEYS = {
  all:             ['listings'] as const,
  list:            (filter: ListingFilter) => ['listings', 'list', filter] as const,
  recommendations: ['listings', 'recommendations'] as const,
}

// ── useListings ───────────────────────────────────────────────────────────────

/**
 * Lấy danh sách Clearance Listing từ GET /api/listings.
 * Re-fetch tự động khi `filter` thay đổi (vì nằm trong query key).
 */
export function useListings(filter: ListingFilter = {}) {
  return useQuery({
    queryKey: LISTING_QUERY_KEYS.list(filter),
    queryFn:  () => getListings(filter),
    staleTime: 60 * 1000, // 1 phút
  })
}

// ── useRecommendations ────────────────────────────────────────────────────────

/**
 * Lấy gợi ý cá nhân hóa từ GET /api/listings/recommendations.
 * Nếu chưa đăng nhập, API trả lỗi 401 → query sẽ có isError = true,
 * component sẽ ẩn section này.
 */
export function useRecommendations() {
  return useQuery({
    queryKey: LISTING_QUERY_KEYS.recommendations,
    queryFn:  getRecommendations,
    retry: false, // 401 → không retry
    staleTime: 2 * 60 * 1000, // 2 phút
  })
}
