import { apiClient } from './client'

export interface StoreProfileDTO {
  name: string;
  description: string | null;
  addressLine: string;
  ward: string | null;
  district: string;
  city: string;
  phoneNumber: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
}

export interface UpdateStoreProfileRequest {
  name: string;
  description: string | null;
  addressLine: string;
  ward: string | null;
  district: string;
  city: string;
  phoneNumber: string | null;
}

export interface StoreAnalyticsDTO {
  totalRevenue: number;
  revenuePercentageChange: number;
  completedOrders: number;
  ordersPercentageChange: number;
}

export const storeApi = {
  updateStoreImages: async (storeId: string, formData: FormData): Promise<void> => {
    await apiClient(`/stores/${storeId}/images`, {
      method: 'PUT',
      body: formData,
    })
  },

  getStoreProfile: async (storeId: string): Promise<StoreProfileDTO> => {
    return await apiClient(`/stores/${storeId}/dashboard/profile`, {
      method: 'GET'
    })
  },
  
  getStoreAnalytics: async (storeId: string): Promise<StoreAnalyticsDTO> => {
    return await apiClient(`/stores/${storeId}/analytics`, {
      method: 'GET'
    })
  },

  updateStoreProfile: (storeId: string, data: UpdateStoreProfileRequest): Promise<void> => {
    return apiClient<void>(`/stores/${storeId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

