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
}

export interface AdminUserListDTO {
  id: string;
  email: string;
  fullName: string;
  status: number;
  roles: string[];
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
  roles: string[];
  storeAffiliations: AdminStoreStaffInfoDTO[];
}

export interface AdminStoreApprovalDTO {
  id: string;
  name: string;
  addressLine: string;
  phoneNumber?: string;
  ownerName?: string;
  ownerEmail?: string;
  createdAt: string;
}

export interface MonthlyRevenue {
  year: number;
  month: number;
  revenue: number;
}

export interface AdminRevenueStatsResponse {
  totalRevenue: number;
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
  storeId: string;
  storeName: string;
  amount: number;
  status: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
}

export interface RefundRequestDTO {
  id: string;
  orderId: string;
  requestedBy: string;
  customerName: string;
  amount: number;
  reason: string;
  status: number;
  adminNote?: string;
  customerBankName?: string;
  customerBankAccount?: string;
  customerBankAccountName?: string;
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
    
  getRefunds: (pageNumber: number = 1, pageSize: number = 10, status?: number) => {
    let url = `/admin/finance/refunds?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (status !== undefined) url += `&status=${status}`;
    return apiClient<PaginatedList<RefundRequestDTO>>(url);
  },
  
  processRefund: (id: string, request: ProcessFinanceRequestDTO) => 
    apiClient(`/admin/finance/refunds/${id}/process`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }),
};
