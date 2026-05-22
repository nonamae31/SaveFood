// ─── TypeScript Types: Order ────────────────────────────────────────────────

/** Trạng thái đơn hàng — theo flow của SaveFood */
export type OrderStatus =
  | 'pending'           // Chờ xác nhận từ cửa hàng
  | 'confirmed'         // Cửa hàng đã xác nhận
  | 'ready_for_pickup'  // Sẵn sàng để khách lấy (kèm pickup code)
  | 'completed'         // Khách đã lấy hàng thành công
  | 'cancelled'         // Đã hủy (cửa hàng hoặc khách)
  | 'expired'           // Hết giờ lấy hàng mà không đến lấy

/** Một món trong đơn hàng */
export interface OrderItem {
  productId:   string
  productName: string   // Snapshot tên lúc đặt hàng
  imageUrl:    string | null
  quantity:    number
  priceAtTime: number   // Snapshot giá lúc đặt (VND)
}

/** Thông tin đơn hàng */
export interface Order {
  id:          string
  buyerId:     string
  storeId:     string
  storeName:   string
  items:       OrderItem[]
  totalAmount: number         // VND
  status:      OrderStatus
  pickupCode:  string | null  // Chỉ hiển thị khi status = 'ready_for_pickup'
  pickupBy:    string         // ISO 8601 — hạn chót lấy hàng
  paymentMethod: 'vnpay' | 'cash'
  isPaid:      boolean
  createdAt:   string
  updatedAt:   string
}

/** Payload tạo đơn hàng mới */
export interface CreateOrderPayload {
  items: Array<{
    productId: string
    quantity:  number
  }>
  paymentMethod: 'vnpay' | 'cash'
}

/** Payload cập nhật trạng thái đơn (dùng cho Store Owner) */
export interface UpdateOrderStatusPayload {
  status: OrderStatus
}
