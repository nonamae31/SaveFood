import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthContext } from './AuthContext';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../services/notificationService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  hasMore: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Khởi tạo kết nối SignalR
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://localhost:7251/api').replace('/api', '');
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/notifications`, {
        accessTokenFactory: () => token || '',
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => console.log('SignalR Notification connected'))
      .catch(err => console.error('SignalR Connection Error: ', err));

    connection.on('ReceiveNotification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      connection.stop();
    };
  }, [user]);

  // Load data ban đầu khi user đăng nhập
  useEffect(() => {
    if (user) {
      loadInitialData();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [notifData, countData] = await Promise.all([
        notificationService.getNotifications(1, 20),
        notificationService.getUnreadCount()
      ]);
      setNotifications(notifData.items);
      setUnreadCount(countData.count);
      setPage(1);
      setHasMore(notifData.page < notifData.totalPages);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;
    try {
      setLoading(true);
      const nextPage = page + 1;
      const notifData = await notificationService.getNotifications(nextPage, 20);
      setNotifications(prev => [...prev, ...notifData.items]);
      setPage(nextPage);
      setHasMore(notifData.page < notifData.totalPages);
    } catch (err) {
      console.error('Failed to load more notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, loadMore, markAsRead, markAllAsRead, hasMore }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
