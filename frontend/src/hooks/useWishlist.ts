import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getWishlists, removeWishlistItem } from '@/api/wishlist.api';

export const WISHLIST_QUERY_KEYS = {
  all: ['wishlists'] as const,
};

export function useGetWishlist() {
  return useQuery({
    queryKey: WISHLIST_QUERY_KEYS.all,
    queryFn: getWishlists,
  });
}

export function useRemoveWishlistItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: removeWishlistItem,
    onSuccess: () => {
      // Invalidate wishlist query to refetch after deletion
      queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEYS.all });
    },
  });
}
