import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'

export interface OrderHistoryDTO {
  id: string
  storeId: string
  storeName: string
  totalAmount: number
  orderStatus: number
  createdAt: string
  firstItemImageUrl?: string
  totalItems: number
}

export interface OrderDetailDTO {
  id: string
  storeId: string
  storeName: string
  storeAddress: string
  totalAmount: number
  orderStatus: number
  createdAt: string
  pickupCode?: string
  orderCode?: number
  reservationExpiresAt?: string
  expectedPickupTime?: string
  confirmedById?: string
  payment?: {
    paymentMethod: number
    status: number
    paidAt?: string
  }
  items: Array<{
    id: string
    listingId: string
    title: string
    quantity: number
    unitPrice: number
    imageUrl?: string
  }>
}

export function useMyOrders() {
  return useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const res = await apiClient<OrderHistoryDTO[]>('/orders')
      return res
    }
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await apiClient<OrderDetailDTO>(`/orders/${id}`)
      return res
    },
    enabled: !!id
  })
}

export function useExtendPickup(orderId: string) {
  return useMutation({
    mutationFn: async (additionalMinutes: number) => {
      return apiClient<{ success: boolean; message: string }>(`/orders/${orderId}/extend-pickup`, {
        method: 'PUT',
        body: JSON.stringify({ additionalMinutes })
      })
    }
  })
}

export function useCancelOrder(orderId: string) {
  return useMutation({
    mutationFn: async (req: { bankName: string; bankAccount: string; bankAccountName: string; reason: string }) => {
      return apiClient<{ success: boolean; message: string }>(`/orders/${orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify(req)
      })
    }
  })
}
