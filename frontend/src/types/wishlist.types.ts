// src/types/wishlist.types.ts

export interface WishlistItem {
  productId: string;
  productName: string;
  price: number;
  originalPrice: number;
  imageUrl: string | null;
  storeName: string;
}
