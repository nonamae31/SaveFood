// ─── API: Customer-facing Clearance Listings ────────────────────────────────
// Gọi các endpoint từ CustomerListingsController:
//   GET /api/customerlistings              — danh sách có filter + phân trang
//   GET /api/customerlistings/recommendations — gợi ý cá nhân hóa (cần auth)

import { apiClient } from './client'
import type { CustomerListingDTO, ListingFilter, PaginatedResult } from '@/types/listing.types'

/** Chuyển object filter thành URLSearchParams (bỏ qua các giá trị undefined) */
function toQueryString(filter: ListingFilter): string {
  const params = new URLSearchParams()
  if (filter.storeId !== undefined) params.set('storeId', filter.storeId)
  if (filter.categoryIds !== undefined && filter.categoryIds.length > 0) {
    filter.categoryIds.forEach(id => params.append('categoryIds', id))
  }
  if (filter.minPrice !== undefined) params.set('minPrice', String(filter.minPrice))
  if (filter.maxPrice !== undefined) params.set('maxPrice', String(filter.maxPrice))
  if (filter.isSurpriseBag !== undefined) params.set('isSurpriseBag', String(filter.isSurpriseBag))
  if (filter.sortBy !== undefined) params.set('sortBy', filter.sortBy)
  if (filter.searchQuery !== undefined) params.set('searchQuery', filter.searchQuery)
  if (filter.userLat !== undefined) params.set('userLat', String(filter.userLat))
  if (filter.userLng !== undefined) params.set('userLng', String(filter.userLng))
  if (filter.radiusKm !== undefined) params.set('radiusKm', String(filter.radiusKm))
  if (filter.page !== undefined) params.set('page', String(filter.page))
  if (filter.pageSize !== undefined) params.set('pageSize', String(filter.pageSize))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

/** GET /api/listings — danh sách Clearance Listings có phân trang */
export function getListings(filter: ListingFilter = {}): Promise<PaginatedResult<CustomerListingDTO>> {
  return apiClient<PaginatedResult<CustomerListingDTO>>(`/listings${toQueryString(filter)}`)
}

/** GET /api/listings/{id} — lấy thông tin chi tiết của 1 listing */
export function getListingById(id: string, userLat?: number, userLng?: number): Promise<CustomerListingDTO> {
  const params = new URLSearchParams()
  if (userLat !== undefined) params.set('userLat', String(userLat))
  if (userLng !== undefined) params.set('userLng', String(userLng))
  const qs = params.toString()
  return apiClient<CustomerListingDTO>(`/listings/${id}${qs ? `?${qs}` : ''}`)
}

/** GET /api/listings/recommendations — gợi ý cá nhân hóa theo lịch sử mua */
export function getRecommendations(): Promise<CustomerListingDTO[]> {
  return apiClient<CustomerListingDTO[]>('/listings/recommendations')
}
