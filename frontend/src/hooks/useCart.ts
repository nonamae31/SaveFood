import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCart, addToCart, updateCartItem, removeFromCart } from '@/api/cart.api'
import type { AddToCartRequest, UpdateCartItemRequest } from '@/types/cart.types'
import { useAuthContext } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'

export const CART_QUERY_KEY = ['cart']

export function useCart() {
  const { isAuthenticated } = useAuthContext()

  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: getCart,
    enabled: isAuthenticated,
    staleTime: 1000 * 10, // 10 seconds to avoid stale cart errors during navigation
    retry: 1
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
    onMutate: async ({ id, req }) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY })
      const previousCart = queryClient.getQueryData<any[]>(CART_QUERY_KEY)

      if (previousCart) {
        queryClient.setQueryData(CART_QUERY_KEY, previousCart.map(item => 
          item.id === id ? { ...item, quantity: req.quantity } : item
        ))
      }

      return { previousCart }
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousCart)
      }
      toast.error('Cập nhật giỏ hàng thất bại. Đã hoàn tác số lượng.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
    }
  })
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => removeFromCart(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY })
      const previousCart = queryClient.getQueryData<any[]>(CART_QUERY_KEY)

      if (previousCart) {
        queryClient.setQueryData(CART_QUERY_KEY, previousCart.filter(item => item.id !== id))
      }

      return { previousCart }
    },
    onError: (err, id, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousCart)
      }
      toast.error('Xóa khỏi giỏ hàng thất bại.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
    }
  })
}
