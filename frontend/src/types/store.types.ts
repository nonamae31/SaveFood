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
