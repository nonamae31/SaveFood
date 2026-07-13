// ─── Hooks: Clearance Listings (React Query) ────────────────────────────────

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getListings, getRecommendations } from '@/api/listings.api'
import type { ListingFilter, PaginatedResult, CustomerListingDTO } from '@/types/listing.types'

// ── Query Keys ────────────────────────────────────────────────────────────────

export const LISTING_QUERY_KEYS = {
  all:             ['listings'] as const,
  list:            (filter: ListingFilter) => ['listings', 'list', filter] as const,
  recommendations: (userLat?: number, userLng?: number) => ['listings', 'recommendations', userLat, userLng] as const,
}

// ── useListings (legacy — dùng trong HomePage, không paginate) ───────────────

/**
 * @deprecated Dùng `useListingsInfinite` cho ProductListPage infinite scroll.
 * Hook này giữ lại để không break HomePage hiện tại.
 * Lấy page=1, pageSize=12 cố định.
 */
export function useListings(filter: ListingFilter = {}) {
  return useQuery({
    queryKey: LISTING_QUERY_KEYS.list(filter),
    queryFn:  () => getListings({ ...filter, page: 1, pageSize: 12 }),
    staleTime: 60 * 1000, // 1 phút
    select: (data) => data.items, // backward compat: trả về mảng
  })
}

// ── useListingsInfinite (dùng trong ProductListPage infinite scroll) ──────────

/**
 * Infinite scroll — tự động load trang tiếp khi cuộn.
 * `pages` là mảng PaginatedResult, mỗi element là một page.
 */
export function useListingsInfinite(filter: ListingFilter = {}) {
  const baseFilter = { ...filter, pageSize: filter.pageSize ?? 12 }

  return useInfiniteQuery<PaginatedResult<CustomerListingDTO>>({
    queryKey: LISTING_QUERY_KEYS.list(baseFilter),
    queryFn: ({ pageParam = 1 }) =>
      getListings({ ...baseFilter, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.pageNumber + 1 : undefined,
    staleTime: 60 * 1000, // 1 phút — Redis cache TTL 5 phút nên frontend 1 phút là ok
  })
}

// ── useRecommendations ────────────────────────────────────────────────────────

/**
 * Lấy gợi ý cá nhân hóa từ GET /api/customerlistings/recommendations.
 * Nếu chưa đăng nhập, API trả lỗi 401 → query sẽ có isError = true,
 * component sẽ ẩn section này.
 */
export function useRecommendations(userLat?: number, userLng?: number) {
  return useQuery({
    queryKey: LISTING_QUERY_KEYS.recommendations(userLat, userLng),
    queryFn:  () => getRecommendations(userLat, userLng),
    retry: false, // 401 → không retry
    staleTime: 2 * 60 * 1000, // 2 phút
  })
}
