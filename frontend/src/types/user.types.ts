// ─── TypeScript Types: User & Auth ─────────────────────────────────────────

/** Vai trò người dùng trong hệ thống */
export type UserRole = 'buyer' | 'store_owner' | 'admin'

/** Thông tin người dùng */
export interface User {
  id:         string
  email:      string
  fullName:   string
  avatarUrl:  string | null
  role:       UserRole
  phoneNumber: string | null
  address:    string | null
  storeId:    string | null   // Chỉ có khi role = 'store_owner'
  createdAt:  string
}

/** JWT tokens trả về sau khi đăng nhập */
export interface AuthTokens {
  accessToken:  string
  refreshToken: string
  expiresAt:    number   // Unix timestamp (ms) — thời điểm access token hết hạn
}

/** Phản hồi đăng nhập/đăng ký */
export interface AuthResponse {
  user:   User
  tokens: AuthTokens
}

/** Payload đăng ký tài khoản */
export interface RegisterPayload {
  email:       string
  password:    string
  fullName:    string
  phoneNumber?: string
  role:        'buyer' | 'store_owner'
}

/** Payload đăng nhập */
export interface LoginPayload {
  email:    string
  password: string
}

/** Payload làm mới token */
export interface RefreshTokenPayload {
  refreshToken: string
}
