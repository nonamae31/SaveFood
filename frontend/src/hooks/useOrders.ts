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
  paymentMethod: number
  paymentStatus?: number
  reservationExpiresAt?: string
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
  qrToken?: string
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

export interface PagedResult<T> {
  data: T[]
  totalRecords: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export function useMyOrders(status?: number | null, page: number = 1, pageSize: number = 5) {
  return useQuery({
    queryKey: ['myOrders', status, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (status !== undefined && status !== null) {
        params.append('status', status.toString())
      }
      params.append('page', page.toString())
      params.append('pageSize', pageSize.toString())
      
      const res = await apiClient<PagedResult<OrderHistoryDTO>>(`/orders?${params.toString()}`)
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
    mutationFn: async (req: { reason: string }) => {
      return apiClient<{ success: boolean; message: string }>(`/orders/${orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify(req)
      })
    }
  })
}

export function useBatchPay() {
  return useMutation({
    mutationFn: async (data: { orderIds: string[], returnUrl?: string, cancelUrl?: string }) => {
      return apiClient<{ orderId: string, checkoutUrl?: string, reservationExpiresAt?: string }>('/orders/pay-batch', {
        method: 'POST',
        body: JSON.stringify(data)
      })
    }
  })
}

export function useConfirmReceipt(orderId: string) {
  return useMutation({
    mutationFn: async () => {
      return apiClient<{ success: boolean; message: string }>(`/orders/${orderId}/confirm-receipt`, {
        method: 'POST'
      })
    }
  })
}

export function useRepurchase(orderId: string) {
  return useMutation({
    mutationFn: async () => {
      return apiClient<{ success: boolean; message: string }>(`/orders/${orderId}/repurchase`, {
        method: 'POST'
      })
    }
  })
}
