import { useEffect } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { queryClient } from '@/lib/queryClient';

export function GlobalNotificationListener() {
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) return;

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://localhost:7251/api').replace('/api', '');
    
    const connection = new HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/notifications`, {
        withCredentials: true,
        accessTokenFactory: () => localStorage.getItem('sf_access_token') || ''
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log('Connected to Notification Hub');
      })
      .catch(err => console.error('SignalR Connection Error: ', err));

    // Lắng nghe sự kiện NewOrderReceived (cho Store/Owner)
    connection.on('ReceiveNotification', (notif: any) => {
      if (notif.type === 'NEW_ORDER') {
        toast.success(`Có đơn hàng mới! Vui lòng kiểm tra màn hình quản lý đơn hàng.`, {
            duration: 5000,
            position: 'top-right'
        });
      }
    });

    // Lắng nghe sự kiện khách hàng: Đơn hàng cập nhật trạng thái
    connection.on('OrderStatusUpdated', (orderId: string, status: number) => {
        const statusMap: Record<number, string> = {
            1: 'Đã xác nhận',
            2: 'Chờ lấy hàng',
            3: 'Hoàn thành',
            4: 'Đã hủy'
        };
        const statusText = statusMap[status] || 'Đang xử lý';

        toast.success(`Đơn hàng của bạn vừa được cập nhật thành: ${statusText}`, {
            icon: '📦',
            duration: 5000,
            position: 'top-right'
        });

        // Tự động invalidate cache để cập nhật dữ liệu mới nhất ở mọi nơi
        queryClient.invalidateQueries({ queryKey: ['myOrders'] });
        queryClient.invalidateQueries({ queryKey: ['order', orderId] });

        // Vẫn dispatch event nếu có component nào cần custom logic
        window.dispatchEvent(new CustomEvent('order-status-updated', { detail: { orderId, status } }));
    });

    return () => {
      connection.stop();
    };
  }, [user]);

  return null; // Component này chỉ chạy ngầm, không render giao diện
}
