import { useQuery } from '@tanstack/react-query'
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
