export interface CartItem {
  id: string
  listingId: string
  title: string
  imageUrl?: string
  salePrice: number
  originalPrice: number
  storeId: string
  storeName: string
  quantity: number
  availableQuantity: number
  expiryDate: string
  isExpired: boolean
}

export interface AddToCartRequest {
  listingId: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}
