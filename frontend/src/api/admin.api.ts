import { apiClient } from './client';

// Types
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
  getUsers: () => apiClient<AdminUserListDTO[]>('/admin/users'),
  
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
