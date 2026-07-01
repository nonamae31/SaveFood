import { apiClient } from '@/lib/apiClient';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedNotifications {
  items: Notification[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const notificationService = {
  getNotifications: async (page = 1, pageSize = 20): Promise<PaginatedNotifications> => {
    return await apiClient<PaginatedNotifications>(`/notifications?page=${page}&pageSize=${pageSize}`);
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    return await apiClient<{ count: number }>('/notifications/unread-count');
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient<void>(`/notifications/${id}/read`, { method: 'PUT' });
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient<void>('/notifications/read-all', { method: 'PUT' });
  }
};
