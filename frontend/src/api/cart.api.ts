import { apiClient } from '@/lib/apiClient'
import type { CartItem, AddToCartRequest, UpdateCartItemRequest } from '@/types/cart.types'

// ─── Lấy giỏ hàng ───
export async function getCart(): Promise<CartItem[]> {
  return apiClient<CartItem[]>('/cart')
}

// ─── Thêm vào giỏ ───
export async function addToCart(req: AddToCartRequest): Promise<CartItem> {
  return apiClient<CartItem>('/cart/items', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

// ─── Cập nhật số lượng ───
export async function updateCartItem(id: string, req: UpdateCartItemRequest): Promise<CartItem> {
  return apiClient<CartItem>(`/cart/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  })
}

// ─── Xóa khỏi giỏ ───
export async function removeFromCart(id: string): Promise<void> {
  await apiClient<void>(`/cart/items/${id}`, {
    method: 'DELETE',
  })
}
