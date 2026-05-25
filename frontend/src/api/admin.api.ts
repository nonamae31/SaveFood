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
};
