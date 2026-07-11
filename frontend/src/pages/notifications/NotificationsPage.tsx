import React, { useState, useEffect } from 'react';
import { Bell, Check, Package, DollarSign, MessageSquare, AlertCircle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';

export function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    loadMore, 
    hasMore, 
    loading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  const location = useLocation();
  const isCustomerPage = location.pathname === '/notifications';

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Tự động tải thêm nếu trang hiện tại cần nhiều thông báo hơn mức đã tải
  useEffect(() => {
    const requiredItems = currentPage * itemsPerPage;
    if (notifications.length < requiredItems && hasMore && !loading) {
      loadMore();
    }
  }, [currentPage, notifications.length, hasMore, loading, loadMore]);

  const paginatedNotifications = notifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPagesLocally = Math.ceil(notifications.length / itemsPerPage);
  const canGoNext = currentPage < totalPagesLocally || hasMore;
  const canGoPrev = currentPage > 1;

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER_PLACED':
      case 'ORDER_STATUS_CHANGED':
        return <Package className="w-6 h-6 text-blue-500" />;
      case 'WITHDRAWAL_PROCESSED':
        return <DollarSign className="w-6 h-6 text-green-500" />;
      case 'NEW_REVIEW':
      case 'REVIEW_REPLIED':
        return <MessageSquare className="w-6 h-6 text-yellow-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(id);
    }
  };

  const containerClasses = isCustomerPage 
    ? "max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
    : "space-y-6";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-600" />
            Tất cả thông báo
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý và xem lại tất cả các thông báo của bạn.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
          >
            <Check className="w-4 h-4" /> 
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
        {notifications.length === 0 && !loading ? (
          <div className="p-12 text-center text-gray-400">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="font-semibold text-gray-600 mb-1">Không có thông báo nào</h3>
            <p className="text-sm text-gray-500">Bạn chưa nhận được bất kỳ thông báo nào.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {paginatedNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif.id, notif.isRead)}
                className={`p-5 flex gap-4 cursor-pointer transition-colors ${
                  !notif.isRead ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0 mt-1 p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <p className={`text-base ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                      {notif.title}
                    </p>
                    <span className="text-xs font-medium text-gray-400 flex-shrink-0 mt-1">
                      {new Date(notif.createdAt).toLocaleString('vi-VN', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">
                    {notif.body}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="flex-shrink-0 flex items-center justify-center pl-2">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Phân trang */}
        {(notifications.length > itemsPerPage || hasMore) && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Hiển thị <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, notifications.length + (hasMore ? itemsPerPage : 0))}</span>
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={!canGoPrev || loading}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
              <span className="text-sm font-medium px-2 text-gray-700">
                Trang {currentPage}
              </span>
              <button 
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={!canGoNext || loading}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
             <div className="flex items-center gap-2 text-brand-600 font-medium bg-white px-4 py-2 rounded-full shadow-md">
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang tải...
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
