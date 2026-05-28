// ─── TypeScript Types: Category ─────────────────────────────────────────────
// Danh mục thực phẩm được Admin quản lý động từ Database.
// Thay thế cho FoodCategory union type (enum tĩnh) đã dùng trước đây.

/** Một Danh mục thực phẩm trả về từ API */
export interface Category {
  id: string
  name: string
  createdAt: string
  isDeleted: boolean
  productCount: number
}

/** Payload để Tạo mới hoặc Cập nhật Danh mục */
export interface CategoryRequest {
  name: string
}
