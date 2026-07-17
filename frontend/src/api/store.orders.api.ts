import { apiClient } from './client';

export interface StoreOrderItemDTO {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface StoreOrderDTO {
  id: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  orderStatus: number;
  orderStatusLabel: string;
  createdAt: string;
  items: StoreOrderItemDTO[];
  // Pickup & Payment info
  pickupCode?: string | null;
  orderCode?: number | null;
  paymentMethod?: number | null;  // 0=Cash, 1=PayOS
  paymentStatus?: number | null;  // 0=Pending, 1=Paid
  expectedPickupTime?: string | null;
}

export const storeOrdersApi = {
  getOrders: (storeId: string): Promise<StoreOrderDTO[]> =>
    apiClient<StoreOrderDTO[]>(`/stores/${storeId}/orders`),

  lookupByPickupCode: (storeId: string, pickupCode: string): Promise<StoreOrderDTO> =>
    apiClient<StoreOrderDTO>(`/stores/${storeId}/orders/lookup?pickupCode=${encodeURIComponent(pickupCode)}`),

  confirm: (storeId: string, orderId: string): Promise<void> =>
    apiClient<void>(`/stores/${storeId}/orders/${orderId}/confirm`, { method: 'PUT' }),

  markReady: (storeId: string, orderId: string): Promise<void> =>
    apiClient<void>(`/stores/${storeId}/orders/${orderId}/ready`, { method: 'PUT' }),

  cancel: (storeId: string, orderId: string): Promise<void> =>
    apiClient<void>(`/stores/${storeId}/orders/${orderId}/cancel`, { method: 'PUT' }),
};
