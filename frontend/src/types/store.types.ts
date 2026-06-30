// ─── TypeScript Types: Store ────────────────────────────────────────────────

import type { PaginatedResponse } from './api.types'

/** Loại hình cửa hàng */
export type StoreCategory = 'restaurant' | 'supermarket' | 'bakery' | 'grocery' | 'cafe'

/** Trạng thái cửa hàng */
export type StoreStatus = 'active' | 'pending' | 'suspended'

/** Địa chỉ cửa hàng kèm tọa độ để hiển thị bản đồ */
export interface StoreAddress {
  street:   string
  ward:     string       // Phường/Xã
  district: string       // Quận/Huyện
  city:     string
  lat:      number       // Vĩ độ
  lng:      number       // Kinh độ
}

/** Giờ hoạt động — null = đóng cửa ngày đó */
export interface DayHours {
  open:  string   // "08:00"
  close: string   // "22:00"
}

export interface OperatingHours {
  monday?:    DayHours | null
  tuesday?:   DayHours | null
  wednesday?: DayHours | null
  thursday?:  DayHours | null
  friday?:    DayHours | null
  saturday?:  DayHours | null
  sunday?:    DayHours | null
}

/** Thông tin cửa hàng */
export interface Store {
  id:              string
  ownerId:         string
  name:            string
  description:     string
  category:        StoreCategory
  logoUrl:         string | null
  coverUrl:        string | null
  address:         StoreAddress
  phoneNumber:     string | null
  status:          StoreStatus
  rating:          number         // 0.0–5.0
  reviewCount:     number
  activeListings:  number         // Số tin đăng đang bán
  isVerified:      boolean
  operatingHours:  OperatingHours
  createdAt:       string
}

/** Danh sách cửa hàng phân trang */
export type StoresResponse = PaginatedResponse<Store>

/** Payload tạo/cập nhật cửa hàng */
export interface CreateStorePayload {
  name:           string
  description:    string
  category:       StoreCategory
  phoneNumber:    string
  address:        StoreAddress
  operatingHours: OperatingHours
}

export type UpdateStorePayload = Partial<CreateStorePayload>

// ─── PRODUCTS (Owner-facing) ────────────────────────────────────────────────

export interface ProductResponseDTO {
  id: string
  storeId: string
  categoryId: string
  name: string
  description?: string
  originalPrice: number
  isHidden: boolean
  isSurpriseBag: boolean
  createdAt: string
  images: { id: string; imageUrl: string }[]
}

export interface CreateProductDTO {
  categoryId: string
  name: string
  description?: string
  originalPrice: number
  isSurpriseBag: boolean
}

export interface UpdateProductDTO {
  categoryId: string
  name: string
  description?: string
  originalPrice: number
  isSurpriseBag: boolean
  isHidden: boolean
}

// ─── LISTINGS (Owner-facing) ────────────────────────────────────────────────

export interface DiscountRuleDTO {
  discountPercent?: number
  targetPrice?: number
  triggerValue: number
  triggerType: number // 0 = TimeBeforeExpiry, 1 = StockRemaining
  ruleOrder: number
}

export interface DiscountRuleResponseDTO {
  id: string
  ruleOrder: number
  discountPercent?: number
  targetPrice?: number
  triggerValue: number
  triggerType: number
  isActive: boolean
}

export interface ListingResponseDTO {
  id: string
  productId: string
  title: string
  salePrice: number
  quantityAvailable: number
  expiryDate: string
  status: number // 0 = Draft, 1 = Published, 2 = SoldOut, 3 = Expired
  createdAt: string
  discountRules: DiscountRuleResponseDTO[]
  images: { id: string; imageUrl: string }[]
}

export interface CreateListingDTO {
  productId: string
  title: string
  salePrice: number
  quantityAvailable: number
  expiryDate: string
  discountRules: DiscountRuleDTO[]
  reusedProductImageIds?: string[]
}

export interface UpdateListingDTO {
  title: string
  salePrice: number
  quantityAvailable: number
  expiryDate: string
  status: number
  discountRules: DiscountRuleDTO[]
  reusedProductImageIds?: string[]
}
