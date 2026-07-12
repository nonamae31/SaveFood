// ─── TypeScript Types: Clearance Listing (Customer-facing) ──────────────────
// Khớp chính xác với CustomerListingDTO và CustomerListingFilterDTO từ Backend.
// KHÔNG dùng product.types.ts cũ vì cấu trúc khác.

/** Wrapper phân trang — khớp với PaginatedList<T> từ Backend */
export interface PaginatedResult<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/** Một tin đăng Clearance Listing trả về từ GET /api/customerlistings */
export interface CustomerListingDTO {
  id: string
  productId: string
  storeId: string
  storeName: string
  productName: string
  title: string
  originalPrice: number    // VND
  salePrice: number        // VND (sau khi dynamic pricing)
  quantityAvailable: number
  expiryDate: string       // ISO 8601
  isSurpriseBag: boolean
  imageUrl?: string
  images?: string[]
  hasFeaturedBadge?: boolean
  priorityLevel?: number
  distance?: number        // km (tính in-memory, không cache)
  storeStatus: number
  storeLatitude?: number   // Tọa độ Store — dùng để đặt Marker trên Map
  storeLongitude?: number  // Tọa độ Store — dùng để đặt Marker trên Map
  /** Thời điểm UTC kích hoạt Sale Milestone tiếp theo — null nếu không có */
  nextMilestoneTime?: string
  /** Giá bán dự kiến tại Sale Milestone tiếp theo — null nếu không có */
  nextMilestonePrice?: number
}

/** Query params cho GET /api/customerlistings — khớp với CustomerListingFilterDTO Backend */
export interface ListingFilter {
  storeId?: string
  categoryIds?: string[]
  minPrice?: number
  maxPrice?: number
  isSurpriseBag?: boolean
  sortBy?: 'price_asc' | 'price_desc' | 'expiry_asc' | 'distance'
  searchQuery?: string
  userLat?: number
  userLng?: number
  radiusKm?: number
  page?: number
  pageSize?: number
}
