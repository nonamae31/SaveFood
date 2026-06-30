import { apiClient } from './client';

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

export interface CreateSubscriptionPlanRequest {
  name: string;
  description: string | null;
  monthlyPrice: number;
  maxActiveListings: number | null;
  hasCustomBanner: boolean;
  hasFeaturedBadge: boolean;
  priorityLevel: number;
  analyticsLevel: number;
}

export interface UpdateSubscriptionPlanRequest {
  name: string;
  description: string | null;
  monthlyPrice: number;
  maxActiveListings: number | null;
  hasCustomBanner: boolean;
  hasFeaturedBadge: boolean;
  priorityLevel: number;
  analyticsLevel: number;
}

export const subscriptionPlansApi = {
  getAllPlans: () => {
    return apiClient<SubscriptionPlanDTO[]>('/subscription-plans');
  },
  
  getPlanById: (id: string) => {
    return apiClient<SubscriptionPlanDTO>(`/subscription-plans/${id}`);
  },

  createPlan: (data: CreateSubscriptionPlanRequest) => {
    return apiClient<SubscriptionPlanDTO>('/subscription-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePlan: (id: string, data: UpdateSubscriptionPlanRequest) => {
    return apiClient<SubscriptionPlanDTO>(`/subscription-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deletePlan: (id: string) => {
    return apiClient<void>(`/subscription-plans/${id}`, {
      method: 'DELETE',
    });
  },
};
