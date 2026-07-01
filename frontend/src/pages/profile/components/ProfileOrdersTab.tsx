import { Link, useNavigate } from 'react-router-dom'
import { useMyOrders } from '@/hooks/useOrders'
import { ROUTES } from '@/lib/constants'
import { Store, Clock, Package, ChevronRight, ChevronLeft } from 'lucide-react'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { queryClient } from '@/lib/queryClient'

const STATUS_TABS = [
  { id: null, label: 'Tất cả' },
  { id: 0, label: 'Chờ xác nhận' },
  { id: 1, label: 'Đã xác nhận' },
  { id: 2, label: 'Chờ lấy' },
  { id: 3, label: 'Hoàn thành' },
  { id: 4, label: 'Đã huỷ' },
];

export function ProfileOrdersTab() {
  const [activeStatus, setActiveStatus] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5;

  const { data: pageResult, isLoading, error } = useMyOrders(activeStatus, currentPage, pageSize)
  
  const dataArray = Array.isArray(pageResult) ? pageResult : (pageResult as any)?.data || (pageResult as any)?.Data;
  const totalPages = (pageResult as any)?.totalPages || (pageResult as any)?.TotalPages || (Array.isArray(pageResult) ? 1 : 0);

  const navigate = useNavigate()

  useEffect(() => {
    const handleStatusUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
    };
    window.addEventListener('order-status-updated', handleStatusUpdate);
    return () => window.removeEventListener('order-status-updated', handleStatusUpdate);
  }, []);

  const handleTabChange = (status: number | null) => {
    setActiveStatus(status);
    setCurrentPage(1); // reset to page 1 when changing tab
  }

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return { text: 'Chờ xác nhận', color: 'text-orange-600 bg-orange-50' }
      case 1: return { text: 'Đã xác nhận', color: 'text-blue-600 bg-blue-50' }
      case 2: return { text: 'Chờ lấy hàng', color: 'text-indigo-600 bg-indigo-50' }
      case 3: return { text: 'Đã hoàn thành', color: 'text-brand-700 bg-brand-50' }
      case 4: return { text: 'Đã huỷ', color: 'text-red-600 bg-red-50' }
      default: return { text: 'Không xác định', color: 'text-gray-600 bg-gray-50' }
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold mb-4 text-gray-900 font-[--font-display]">Đơn hàng của tôi</h2>
      
      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 pb-2 border-b border-gray-100">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.id === null ? 'all' : tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              activeStatus === tab.id 
                ? 'bg-brand-50 text-brand-600 border border-brand-200' 
                : 'bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="p-8 text-center mt-10 text-gray-500">Đang tải danh sách đơn hàng...</div>
      )}

      {error && (
        <div className="p-8 text-center text-red-500 mt-10">Lỗi khi tải đơn hàng.</div>
      )}

      {!isLoading && !error && (!dataArray || dataArray.length === 0) && (
        <div className="p-8 text-center mt-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Bạn chưa có đơn hàng nào</h2>
            <p className="text-gray-500 mb-6">Chưa có đơn hàng nào trong trạng thái này.</p>
            <Link to={ROUTES.HOME} className="bg-brand-500 text-white px-6 py-3 rounded-full font-bold hover:bg-brand-600 transition-colors inline-block">
              Khám phá ngay
            </Link>
          </div>
        </div>
      )}

      {!isLoading && !error && dataArray && dataArray.length > 0 && (
        <div className="space-y-4">
          {dataArray.map((order: any) => {
            const status = getStatusText(order.orderStatus)
            
            return (
              <div 
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col sm:flex-row gap-4"
              >
                <div className="w-full sm:w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  {order.firstItemImageUrl ? (
                    <img src={order.firstItemImageUrl} alt="Order item" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg">{order.storeName}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500 space-y-1 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{dayjs(order.createdAt).format('HH:mm - DD/MM/YYYY')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Package className="w-4 h-4" />
                      <span>{order.totalItems} sản phẩm</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end mt-auto">
                    <div className="font-bold text-lg text-brand-600">
                      {order.totalAmount.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="flex items-center text-sm text-brand-600 font-medium">
                      Xem chi tiết <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                        currentPage === i + 1 
                          ? 'bg-brand-500 text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 rotate-180" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
