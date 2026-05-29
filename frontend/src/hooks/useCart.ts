import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCart, addToCart, updateCartItem, removeFromCart } from '@/api/cart.api'
import type { AddToCartRequest, UpdateCartItemRequest } from '@/types/cart.types'
import { useAuthContext } from '@/contexts/AuthContext'

export const CART_QUERY_KEY = ['cart']

export function useCart() {
  const { isAuthenticated } = useAuthContext()

  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: getCart,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (req: AddToCartRequest) => addToCart(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
    }
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, req }: { id: string, req: UpdateCartItemRequest }) => updateCartItem(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
    }
  })
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => removeFromCart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
    }
  })
}
