import type { ApiErrorBody } from '@/types/api.types'
import { STORAGE_KEYS } from '@/lib/constants'

// ─── API Client — Fetch Wrapper ─────────────────────────────────────────────
// Tất cả API calls phải đi qua client này. KHÔNG gọi fetch/axios trực tiếp trong component.
//
// Tính năng:
// - Tự động đính kèm JWT Access Token vào Authorization header
// - Tự động thử refresh token khi nhận 401 TOKEN_EXPIRED
// - Ném ApiError thống nhất để React Query xử lý

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5101/api'

/** Lỗi API chuẩn hóa — bắt trong hooks với error instanceof ApiError */
export class ApiError extends Error {
  readonly status: number
  readonly errorCode: string
  readonly isUnauthorized: boolean
  readonly isNotFound: boolean
  readonly isValidation: boolean

  constructor(status: number, errorCode: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errorCode = errorCode
    this.isUnauthorized = status === 401
    this.isNotFound = status === 404
    this.isValidation = status === 400
  }
}

/** Lấy access token hiện tại từ localStorage */
const getAccessToken = (): string | null =>
  localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

/** Lấy refresh token hiện tại từ localStorage */
const getRefreshToken = (): string | null =>
  localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

/** Lưu tokens vào localStorage */
export const saveTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
}

/** Xóa tokens khỏi localStorage (logout) */
export const clearTokens = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
}

/** Thử refresh token — trả về access token mới hoặc null nếu thất bại */
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

const refreshAccessToken = async (): Promise<string | null> => {
  if (isRefreshing) return refreshPromise!

  isRefreshing = true
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return null

    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!res.ok) {
        clearTokens()
        window.location.href = '/login'
        return null
      }

      const json = await res.json()
      const { accessToken, refreshToken: newRefreshToken } = json.data.tokens
      saveTokens(accessToken, newRefreshToken)
      return accessToken as string
    } catch {
      clearTokens()
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * API Client dùng chung — fetch wrapper với auto JWT attach và auto refresh.
 * 
 * @example
 * // GET request
 * const products = await apiClient<ProductsResponse>('/products?page=1')
 * 
 * // POST request
 * const order = await apiClient<Order>('/orders', { method: 'POST', body: JSON.stringify(payload) })
 */
export async function apiClient<T>(
  path: string,
  options?: RequestInit,
  retrying = false,
): Promise<T> {
  const token = getAccessToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  // ── 401: Thử refresh token một lần ──────────────────────────────────────
  if (response.status === 401 && !retrying) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return apiClient<T>(path, options, true) // Gọi lại với token mới
    }
    throw new ApiError(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn.')
  }

  // ── Parse response body ──────────────────────────────────────────────────
  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    const err = json as Partial<ApiErrorBody>
    throw new ApiError(
      response.status,
      err.errorCode ?? 'UNKNOWN_ERROR',
      err.message ?? 'Đã xảy ra lỗi. Vui lòng thử lại.',
    )
  }

  // Backend trả về { success: true, data: T }
  return (json.data ?? json) as T
}
