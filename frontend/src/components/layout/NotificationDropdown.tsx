import React, { useRef, useState, useEffect } from 'react';
import { Bell, Check, Package, DollarSign, MessageSquare, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';

export const NotificationDropdown: React.FC<{ isDark?: boolean; placement?: 'bottom-right' | 'top-right' }> = ({ isDark, placement = 'bottom-right' }) => {
  const { notifications, unreadCount, loadMore, hasMore, loading, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleViewAll = () => {
    setIsOpen(false);
    if (location.pathname.startsWith('/admin')) {
      navigate('/admin/notifications');
    } else if (location.pathname.startsWith('/dashboard')) {
      navigate('/dashboard/notifications');
    } else {
      navigate('/notifications');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER_PLACED':
      case 'ORDER_STATUS_CHANGED':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'WITHDRAWAL_PROCESSED':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'NEW_REVIEW':
      case 'REVIEW_REPLIED':
        return <MessageSquare className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(id);
    }
    // TODO: Navigation based on type and referenceId could be added here
  };

  const buttonClass = isDark
    ? 'relative p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 focus:outline-none'
    : 'relative p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-300 focus:outline-none';

  const menuClass = placement === 'top-right'
    ? 'absolute bottom-full right-0 mb-2 w-64 sm:w-64 bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[100] flex flex-col max-h-[60vh]'
    : 'absolute right-0 mt-2 w-80 sm:w-96 bg-white text-gray-900 rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[100] flex flex-col max-h-[80vh]';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClass}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={menuClass}>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1 font-medium transition-colors"
              >
                <Check className="w-4 h-4" /> Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Bạn chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.id, notif.isRead)}
                  className={`p-3 rounded-lg flex gap-3 cursor-pointer transition-colors ${
                    !notif.isRead ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                      {notif.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap">{notif.body}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="flex-shrink-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div className="pt-2 mt-2 border-t border-gray-100">
              <button
                onClick={handleViewAll}
                className="w-full py-2 text-sm font-medium text-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer block"
              >
                Xem tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
