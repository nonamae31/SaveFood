import { apiClient } from './client'

export interface StoreProfileDTO {
  name: string;
  description: string | null;
  detailedAddress: string;
  ward: string;
  city: string;
  phoneNumber: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  planName: string;
  hasCustomBanner: boolean;
  latitude?: number;
  longitude?: number;
}

export interface UpdateStoreProfileRequest {
  name: string;
  description: string | null;
  detailedAddress: string;
  ward: string;
  city: string;
  phoneNumber: string | null;
  latitude?: number;
  longitude?: number;
}

export interface StoreAnalyticsDTO {
  totalRevenue: number;
  revenuePercentageChange: number;
  completedOrders: number;
  ordersPercentageChange: number;
  planName: string;
  analyticsLevel: number;
  weeklyRevenue: number[];
  topSellingProducts: { name: string; sales: number }[];
}

export const storeApi = {
  updateStoreImages: async (storeId: string, formData: FormData): Promise<void> => {
    await apiClient(`/stores/${storeId}/images`, {
      method: 'PUT',
      body: formData,
    })
  },

  getStoreProfile: async (storeId: string): Promise<StoreProfileDTO> => {
    return await apiClient(`/stores/${storeId}/profile`, {
      method: 'GET'
    })
  },

  getStoreAnalytics: async (storeId: string, days: number = 7): Promise<StoreAnalyticsDTO> => {
    return await apiClient(`/stores/${storeId}/analytics?days=${days}`, {
      method: 'GET'
    })
  },

  updateStoreProfile: (storeId: string, data: UpdateStoreProfileRequest): Promise<void> => {
    return apiClient<void>(`/stores/${storeId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  
  createSubscriptionCheckout: async (storeId: string, planId: string, billingCycle: string): Promise<{ checkoutUrl: string }> => {
    return await apiClient(`/stores/${storeId}/subscriptions/checkout`, {
      method: 'POST',
      body: JSON.stringify({ planId, billingCycle })
    })
  },
}

