import { apiClient } from './client'

export interface SubscriptionPlanDTO {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  isActive: boolean;
  maxActiveListings: number | null;
  hasCustomBanner: boolean;
  hasFeaturedBadge: boolean;
  priorityLevel: number;
  analyticsLevel: number;
}

export const subscriptionApi = {
  getAllPlans: async (): Promise<SubscriptionPlanDTO[]> => {
    return await apiClient('/subscription-plans', {
      method: 'GET'
    })
  }
}
