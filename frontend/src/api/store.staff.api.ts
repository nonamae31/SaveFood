import { apiClient } from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StoreStaffDTO {
  userId: string;
  storeStaffId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  staffRole: number;       // 0 = Owner, 2 = Staff
  staffRoleLabel: string;  // "Owner" | "Staff"
  joinedAt: string;
}

export interface AddStoreStaffRequest {
  email: string;
}

export interface BatchUpdateRoleRequest {
  userIds: string[];
  newRole: number;
}

export interface BatchRemoveStaffRequest {
  userIds: string[];
}

// ── API ───────────────────────────────────────────────────────────────────────

export const storeStaffApi = {
  /** Lấy danh sách nhân viên của cửa hàng. */
  getStoreStaff: async (storeId: string): Promise<StoreStaffDTO[]> => {
    return await apiClient(`/stores/${storeId}/staff`, { method: 'GET' });
  },

  /** Thêm nhân viên mới vào cửa hàng qua email. */
  addStoreStaff: async (storeId: string, request: AddStoreStaffRequest): Promise<StoreStaffDTO> => {
    return await apiClient(`/stores/${storeId}/staff`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /** Xóa một nhân viên khỏi cửa hàng. */
  removeStoreStaff: async (storeId: string, targetUserId: string): Promise<void> => {
    await apiClient(`/stores/${storeId}/staff/${targetUserId}`, { method: 'DELETE' });
  },

  /** Cập nhật vai trò hàng loạt. */
  batchUpdateRole: async (storeId: string, request: BatchUpdateRoleRequest): Promise<void> => {
    await apiClient(`/stores/${storeId}/staff/batch-role`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  },

  /** Xóa nhân viên hàng loạt. */
  batchRemoveStaff: async (storeId: string, request: BatchRemoveStaffRequest): Promise<void> => {
    await apiClient(`/stores/${storeId}/staff/batch`, {
      method: 'DELETE',
      body: JSON.stringify(request),
    });
  },
};
