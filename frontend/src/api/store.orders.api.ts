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
}

export const storeOrdersApi = {
  getOrders: (storeId: string): Promise<StoreOrderDTO[]> =>
    apiClient<StoreOrderDTO[]>(`/stores/${storeId}/orders`),

  confirm: (storeId: string, orderId: string): Promise<void> =>
    apiClient<void>(`/stores/${storeId}/orders/${orderId}/confirm`, { method: 'PUT' }),

  markReady: (storeId: string, orderId: string): Promise<void> =>
    apiClient<void>(`/stores/${storeId}/orders/${orderId}/ready`, { method: 'PUT' }),

  complete: (storeId: string, orderId: string): Promise<void> =>
    apiClient<void>(`/stores/${storeId}/orders/${orderId}/complete`, { method: 'PUT' }),

  cancel: (storeId: string, orderId: string): Promise<void> =>
    apiClient<void>(`/stores/${storeId}/orders/${orderId}/cancel`, { method: 'PUT' }),
};
