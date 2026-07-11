import { Link, useNavigate } from 'react-router-dom'
import { useMyOrders, useBatchPay } from '@/hooks/useOrders'
import { ROUTES } from '@/lib/constants'
import { Store, Clock, Package, ChevronRight, ChevronLeft, CheckSquare } from 'lucide-react'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { queryClient } from '@/lib/queryClient'

const ORDER_STATUS = [
  { id: -1, label: 'Tất cả' },
  { id: -2, label: 'Chờ thanh toán' },
  { id: 0, label: 'Chờ xác nhận' },
  { id: 1, label: 'Đã xác nhận' },
  { id: 2, label: 'Chờ lấy hàng' },
  { id: 3, label: 'Đã hoàn thành' },
  { id: 4, label: 'Đã huỷ' }
];

const PaymentCountdown = ({ expiresAt }: { expiresAt: string }) => {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const target = new Date(expiresAt).getTime()
    const update = () => {
      const now = new Date().getTime()
      setTimeLeft(Math.max(0, Math.floor((target - now) / 1000)))
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [expiresAt])

  if (timeLeft === 0) return <span className="text-red-500 font-bold">(Đã hết hạn)</span>

  const m = Math.floor(timeLeft / 60)
  const s = timeLeft % 60
  return (
    <span className="text-red-700 font-bold flex items-center gap-1">
      <Clock size={16} /> {m}:{s.toString().padStart(2, '0')}
    </span>
  )
}

export function ProfileOrdersTab() {
  const [activeStatus, setActiveStatus] = useState<number>(-1)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const pageSize = 5;

  const { data: pageResult, isLoading, error } = useMyOrders(activeStatus === -1 ? undefined : activeStatus, currentPage, pageSize)
  const batchPayMutation = useBatchPay()
  
  const dataArray = Array.isArray(pageResult) ? pageResult : (pageResult as any)?.items || (pageResult as any)?.Items || (pageResult as any)?.data || (pageResult as any)?.Data;
  const totalPages = (pageResult as any)?.totalPages || (pageResult as any)?.TotalPages || (Array.isArray(pageResult) ? 1 : 0);

  const navigate = useNavigate()

  useEffect(() => {
    const handleStatusUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
    };
    window.addEventListener('order-status-updated', handleStatusUpdate);
    return () => window.removeEventListener('order-status-updated', handleStatusUpdate);
  }, []);

  const handleTabChange = (status: number) => {
    setActiveStatus(status);
    setCurrentPage(1); 
    setSelectedOrders([]);
  }

  const handleBatchPay = () => {
    if (selectedOrders.length === 0) return
    batchPayMutation.mutate(
      { 
        orderIds: selectedOrders,
        returnUrl: window.location.origin + '/checkout/success',
        cancelUrl: window.location.origin + '/checkout/cancel'
      },
      {
        onSuccess: (res) => {
          if (res.checkoutUrl) window.location.href = res.checkoutUrl
        }
      }
    )
  }

  const getStatusText = (status: number, paymentMethod?: number, paymentStatus?: number) => {
    switch (status) {
      case 0: return { text: paymentMethod === 1 && (paymentStatus === 0 || paymentStatus === 2) ? 'Chờ thanh toán' : 'Chờ xác nhận', color: 'text-orange-600 bg-orange-50' }
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
        {ORDER_STATUS.map(tab => (
          <button
            key={tab.id === -1 ? 'all' : tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              activeStatus === tab.id 
                ? 'bg-brand-500 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
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
            const status = getStatusText(order.orderStatus, order.paymentMethod, order.paymentStatus)
            
            return (
              <div 
                key={order.id}
                onClick={() => {
                  if (activeStatus === -2 && order.orderStatus === 0 && order.paymentMethod === 1 && (order.paymentStatus === 0 || order.paymentStatus === 2)) {
                    setSelectedOrders(prev => 
                      prev.includes(order.id) 
                        ? prev.filter(id => id !== order.id)
                        : [...prev, order.id]
                    )
                  } else {
                    navigate(`/orders/${order.id}`)
                  }
                }}
                className={`bg-white rounded-2xl shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col sm:flex-row gap-4 ${selectedOrders.includes(order.id) ? 'border-brand-500 bg-brand-50/10' : 'border-gray-100'}`}
              >
                {activeStatus === -2 && order.orderStatus === 0 && order.paymentMethod === 1 && (order.paymentStatus === 0 || order.paymentStatus === 2 || order.paymentStatus === 3) && (
                  <div className="flex items-center justify-center shrink-0 pr-2">
                    <div className={`w-6 h-6 rounded border flex items-center justify-center ${selectedOrders.includes(order.id) ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-300 text-transparent'}`}>
                      <CheckSquare className="w-4 h-4" />
                    </div>
                  </div>
                )}
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
                  
                  {order.orderStatus === 0 && order.reservationExpiresAt && order.paymentMethod === 1 && (order.paymentStatus === 0 || order.paymentStatus === 2) && (
                    <div className="flex items-center text-sm mb-3 bg-red-50/80 text-red-700 px-3 py-2 rounded-lg border border-red-100/50 w-max">
                      <span className="font-medium mr-1">Thanh toán trong:</span>
                      <PaymentCountdown expiresAt={order.reservationExpiresAt} />
                    </div>
                  )}

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

          {/* Batch Pay Action Bar */}
          {activeStatus === -2 && selectedOrders.length > 0 && (
            <div className="sticky bottom-4 mx-auto w-full max-w-lg bg-white rounded-2xl shadow-xl border border-brand-100 p-4 flex items-center justify-between z-10">
              <div>
                <div className="text-sm text-gray-500">Đã chọn</div>
                <div className="font-bold text-lg text-brand-600">{selectedOrders.length} đơn hàng</div>
              </div>
              <button 
                onClick={handleBatchPay}
                disabled={batchPayMutation.isPending}
                className="bg-brand-500 text-white px-6 py-2.5 rounded-full font-bold hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {batchPayMutation.isPending ? 'Đang xử lý...' : 'Thanh toán ngay'}
              </button>
            </div>
          )}

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
