// ─── TypeScript Types: Product / Clearance Listing ─────────────────────────
// Các kiểu dữ liệu liên quan đến sản phẩm cận date và tin đăng thanh lý.

import type { PaginatedResponse } from './api.types'

/** Danh mục thực phẩm */
export type FoodCategory =
  | 'bakery'          // Bánh mì & bánh ngọt
  | 'dairy'           // Sữa & các sản phẩm từ sữa
  | 'produce'         // Rau củ quả
  | 'meat-seafood'    // Thịt & hải sản
  | 'prepared-meals'  // Đồ ăn sẵn
  | 'beverages'       // Đồ uống
  | 'pantry'          // Đồ khô / thực phẩm đóng gói
  | 'frozen'          // Thực phẩm đông lạnh

/** Trạng thái hết hạn — dùng để hiển thị màu cảnh báo */
export type ExpiryStatus = 'fresh' | 'soon' | 'urgent' | 'expired'

/** Trạng thái sản phẩm trong hệ thống */
export type ProductStatus = 'active' | 'expired' | 'sold_out' | 'removed'

/** Một tin đăng bán thực phẩm cận date */
export interface Product {
  id:              string
  storeId:         string
  storeName:       string
  storeLogoUrl:    string | null
  name:            string
  description:     string
  category:        FoodCategory
  imageUrls:       string[]
  originalPrice:   number          // VND
  discountedPrice: number          // VND
  discountPercent: number          // 0–100
  quantityLeft:    number
  expiresAt:       string          // ISO 8601
  expiryStatus:    ExpiryStatus    // Tính từ expiresAt
  status:          ProductStatus
  isAvailable:     boolean
  createdAt:       string
  updatedAt:       string
}

/** Danh sách sản phẩm phân trang */
export type ProductsResponse = PaginatedResponse<Product>

/** Payload tạo tin đăng mới */
export interface CreateListingPayload {
  name:            string
  description:     string
  category:        FoodCategory
  originalPrice:   number
  discountedPrice: number
  quantityLeft:    number
  expiresAt:       string
  imageUrls:       string[]
}

/** Payload cập nhật tin đăng — tất cả field là optional */
export type UpdateListingPayload = Partial<CreateListingPayload>
