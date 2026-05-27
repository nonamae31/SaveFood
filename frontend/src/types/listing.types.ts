// ─── TypeScript Types: Clearance Listing (Customer-facing) ──────────────────
// Khớp chính xác với CustomerListingDTO và CustomerListingFilterDTO từ Backend.
// KHÔNG dùng product.types.ts cũ vì cấu trúc khác.

/** Một tin đăng Clearance Listing trả về từ GET /api/listings */
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
}

/** Query params cho GET /api/listings — khớp với CustomerListingFilterDTO Backend */
export interface ListingFilter {
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  isSurpriseBag?: boolean
  sortBy?: 'price_asc' | 'price_desc' | 'expiry_asc'
}
