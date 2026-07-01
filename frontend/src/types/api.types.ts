// ─── TypeScript Types: API & Shared ────────────────────────────────────────
// Định nghĩa các kiểu dữ liệu dùng chung cho toàn bộ API calls.
// KHÔNG thay đổi file này khi làm tính năng riêng — tạo file types mới trong src/types/

import type { FoodCategory } from './product.types'
import type { StoreCategory } from './store.types'

// ── API Response Envelope (khớp với Backend ApiResponse<T>) ─────────────────

/** Cấu trúc JSON chuẩn trả về từ mọi API endpoint của SaveFood */
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

/** Lỗi từ API — được ApiError class trong apiClient.ts sử dụng */
export interface ApiErrorBody {
  success: false
  message: string
  errorCode: string
  timestamp: string
  detail?: string // Chỉ có khi Backend chạy ở môi trường Development
}

// ── Phân trang ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  pageNumber: number
  pageSize:   number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

/** Cấu trúc trả về cho các API danh sách phân trang */
export interface PaginatedResponse<T> {
  items: T[]
  meta:  PaginationMeta
}

// ── Bộ lọc tìm kiếm sản phẩm ─────────────────────────────────────────────────

/** Query params để lọc danh sách sản phẩm cận date */
export interface ProductFilters {
  category?:      FoodCategory
  storeId?:       string
  expiryWithin?:  number        // giờ, ví dụ: 24 = sắp hết hạn trong 24h
  minDiscount?:   number        // phần trăm, ví dụ: 30 = giảm ít nhất 30%
  maxPrice?:      number        // VND
  district?:      string
  search?:        string
  sortBy?:        'expiry' | 'discount' | 'price' | 'distance'
  sortOrder?:     'asc' | 'desc'
  pageNumber?:    number
  pageSize?:      number
}

/** Query params để lọc danh sách cửa hàng */
export interface StoreFilters {
  category?:  StoreCategory
  district?:  string
  search?:    string
  verified?:  boolean
  pageNumber?: number
  pageSize?:   number
}

