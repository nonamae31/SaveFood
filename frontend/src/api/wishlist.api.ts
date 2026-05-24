import { apiClient } from './client';
import type { WishlistItem } from '@/types/wishlist.types';

export const getWishlists = (): Promise<WishlistItem[]> =>
  apiClient('/wishlists');

export const removeWishlistItem = (productId: string): Promise<{ message: string }> =>
  apiClient(`/wishlists/${productId}`, {
    method: 'DELETE',
  });
