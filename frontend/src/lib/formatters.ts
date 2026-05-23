import type { ExpiryStatus } from '@/types/product.types'

// ─── Formatters: Tiền tệ, Ngày giờ, Cận date ───────────────────────────────
// Các hàm tiện ích dùng chung để hiển thị dữ liệu đúng định dạng tiếng Việt.
// PHẢI dùng các hàm này thay vì tự format inline trong component.

// ── Tiền tệ VND ──────────────────────────────────────────────────────────────

/** Format số tiền VND — ví dụ: 45000 → "45.000đ" */
export const formatVND = (amount: number): string =>
  `${amount.toLocaleString('vi-VN')}đ`

/** Format khoảng giá — ví dụ: "45.000đ – 120.000đ" */
export const formatPriceRange = (min: number, max: number): string =>
  `${formatVND(min)} – ${formatVND(max)}`

// ── Giảm giá ─────────────────────────────────────────────────────────────────

/** Format phần trăm giảm giá — ví dụ: 40 → "−40%" */
export const formatDiscount = (percent: number): string => `−${Math.round(percent)}%`

/** Tính phần trăm giảm giá từ giá gốc và giá giảm */
export const calcDiscountPercent = (original: number, discounted: number): number =>
  original > 0 ? Math.round(((original - discounted) / original) * 100) : 0

// ── Thời gian cận date ───────────────────────────────────────────────────────

/**
 * Format đếm ngược thời gian hết hạn theo tiếng Việt.
 * - "Sắp hết hạn" → < 1 giờ
 * - "Còn 4 giờ"   → 1–23 giờ
 * - "Còn 2 ngày"  → >= 24 giờ
 * - "Đã hết hạn"  → đã qua thời gian
 */
export const formatExpiryCountdown = (expiresAt: string): string => {
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  if (diffMs <= 0) return 'Đã hết hạn'
  const hours = Math.floor(diffMs / 3_600_000)
  if (hours < 1) return 'Sắp hết hạn'
  if (hours < 24) return `Còn ${hours} giờ`
  return `Còn ${Math.floor(hours / 24)} ngày`
}

/**
 * Xác định ExpiryStatus từ chuỗi ISO datetime.
 * - 'expired' → đã hết hạn
 * - 'urgent'  → < 24 giờ
 * - 'soon'    → 1–3 ngày
 * - 'fresh'   → > 3 ngày
 */
export const getExpiryStatus = (expiresAt: string): ExpiryStatus => {
  const hours = (new Date(expiresAt).getTime() - Date.now()) / 3_600_000
  if (hours <= 0) return 'expired'
  if (hours < 24) return 'urgent'
  if (hours < 72) return 'soon'
  return 'fresh'
}

// ── Ngày giờ ─────────────────────────────────────────────────────────────────

/** Format ngày giờ tiếng Việt — ví dụ: "22/05/2026, 20:30" */
export const formatDateTime = (isoString: string): string =>
  new Date(isoString).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

/** Format chỉ ngày — ví dụ: "22/05/2026" */
export const formatDate = (isoString: string): string =>
  new Date(isoString).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

// ── Chuỗi văn bản ────────────────────────────────────────────────────────────

/** Rút gọn text dài với dấu "..." — ví dụ: truncate("Hello World", 8) → "Hello Wo..." */
export const truncate = (text: string, maxLength: number): string =>
  text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`

/** Lấy chữ cái đầu để hiển thị avatar fallback — ví dụ: "Nguyễn Văn A" → "N" */
export const getInitials = (name: string): string =>
  name.trim().charAt(0).toUpperCase()
