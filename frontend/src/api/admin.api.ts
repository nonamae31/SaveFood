import { apiClient } from './client';

// Types
export interface PaginatedList<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface GetUsersRequest {
  search?: string;
  roleFilter?: string;
  statusFilter?: string;
  sortBy?: string;
  sortDirection?: string;
  pageNumber?: number;
  pageSize?: number;
  staffRoleFilter?: number;
}

export interface RoleInfoDTO {
  code: string;
  name: string;
}

export interface AddUserRequest {
  email: string;
  fullName: string;
  password?: string; // Optional if you auto-generate, but we specified it in DTO
  roleCode: string;
}

export interface AdminUserListDTO {
  id: string;
  email: string;
  fullName: string;
  status: number;
  roles: RoleInfoDTO[];
  createdAt: string;
}

export interface AdminStoreStaffInfoDTO {
  storeId: string;
  storeName: string;
  addressLine: string;
  storeStatus: number;
  staffRole: number;
}

export interface AdminUserDetailsDTO {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phoneNumber?: string;
  address?: string;
  status: number;
  userFlags: number;
  createdAt: string;
  roles: RoleInfoDTO[];
  storeAffiliations: AdminStoreStaffInfoDTO[];
}

export interface AdminStoreApprovalDTO {
  id: string;
  name: string;
  addressLine: string;
  phoneNumber?: string;
  ownerName?: string;
  ownerEmail?: string;
  referenceLink?: string;
  storefrontImageUrl?: string;
  createdAt: string;
}

export interface AdminStoreListDTO {
  id: string;
  name: string;
  addressLine: string;
  ownerName?: string;
  ownerEmail?: string;
  status: number;
  availableBalance: number;
  createdAt: string;
}

export interface AdminStoreDetailsDTO {
  id: string;
  name: string;
  addressLine: string;
  phoneNumber?: string;
  description?: string;
  status: number;
  storefrontImageUrl?: string;
  referenceLink?: string;
  createdAt: string;
  
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;

  availableBalance: number;
  pendingBalance: number;

  currentPlanName?: string;
  planExpiryDate?: string;
}

export interface GetAdminStoresRequest {
  search?: string;
  status?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface MonthlyRevenue {
  year: number;
  month: number;
  revenue: number;
}

export interface AdminRevenueStatsResponse {
  totalRevenue: number;
  totalShopNetRevenue: number;
  monthlyRevenues: MonthlyRevenue[];
}

export interface MonthlySubscriptionStats {
  year: number;
  month: number;
  newSubscriptionsCount: number;
  revenue: number;
}

export interface PlanSubscriptionCount {
  planId: string;
  planName: string;
  activeCount: number;
}

export interface AdminSubscriptionStatsResponse {
  totalActiveSubscriptions: number;
  totalSubscriptionRevenue: number;
  monthlyStats: MonthlySubscriptionStats[];
  activeSubscriptionsByPlan: PlanSubscriptionCount[];
}

export interface WalletTransactionDTO {
  id: string;
  storeWalletId: string;
  storeName: string;
  amount: number;
  type: number;
  status: number;
  orderId?: string;
  description?: string;
  createdAt: string;
}

export interface WithdrawalRequestDTO {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterType: string;
  amount: number;
  status: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
}

export interface ProcessFinanceRequestDTO {
  isApproved: boolean;
  adminNote?: string;
}

// API methods
export const adminApi = {
  getUsers: (params?: GetUsersRequest) => {
    if (!params) return apiClient<PaginatedList<AdminUserListDTO>>('/admin/users');
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    return apiClient<PaginatedList<AdminUserListDTO>>(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  getUserDetails: (id: string) => apiClient<AdminUserDetailsDTO>(`/admin/users/${id}`),

  addUser: (request: AddUserRequest) =>
    apiClient('/admin/users', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  updateUserStatus: (id: string, newStatus: number) =>
    apiClient(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ newStatus }),
    }),

  getPendingStores: () => apiClient<AdminStoreApprovalDTO[]>('/admin/stores/pending'),

  approveStore: (id: string) =>
    apiClient(`/admin/stores/${id}/approve`, {
      method: 'PUT',
    }),

  rejectStore: (id: string, reviewNotes: string) =>
    apiClient(`/admin/stores/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reviewNotes }),
    }),

  getStores: (params?: GetAdminStoresRequest) => {
    let url = '/admin/stores';
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.search) queryParams.append('search', params.search);
      if (params.status !== undefined) queryParams.append('status', params.status.toString());
      if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    }
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return apiClient<PaginatedList<AdminStoreListDTO>>(url);
  },

  getStoreDetails: (id: string) => apiClient<AdminStoreDetailsDTO>(`/admin/stores/${id}`),

  updateStoreStatus: (id: string, newStatus: number) =>
    apiClient(`/admin/stores/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ newStatus }),
    }),

  getRevenueStats: () => apiClient<AdminRevenueStatsResponse>('/admin/stats/revenue'),
  getSubscriptionStats: () => apiClient<AdminSubscriptionStatsResponse>('/admin/stats/subscriptions'),

  // Finance
  getTransactions: (pageNumber: number = 1, pageSize: number = 10) =>
    apiClient<PaginatedList<WalletTransactionDTO>>(`/admin/finance/transactions?pageNumber=${pageNumber}&pageSize=${pageSize}`),

  getWithdrawals: (pageNumber: number = 1, pageSize: number = 10, status?: number) => {
    let url = `/admin/finance/withdrawals?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (status !== undefined) url += `&status=${status}`;
    return apiClient<PaginatedList<WithdrawalRequestDTO>>(url);
  },

  processWithdrawal: (id: string, request: ProcessFinanceRequestDTO) =>
    apiClient(`/admin/finance/withdrawals/${id}/process`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }),
};
