import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useOrder } from '@/hooks/useOrders'
import { ROUTES } from '@/lib/constants'
import { Store, Clock, Package, CheckCircle, ChevronLeft, MapPin, ReceiptText } from 'lucide-react'
import dayjs from 'dayjs'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect } from 'react'
import { HubConnectionBuilder } from '@microsoft/signalr'
import { queryClient } from '@/lib/queryClient'
import { useAuthContext } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/apiClient'

export function OrderDetailPage() {
  const { id: pathId } = useParams()
  const [searchParams] = useSearchParams()
  const id = pathId || searchParams.get('orderId') || ''
  const { data: order, isLoading, error } = useOrder(id)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthContext()

  // Setup SignalR connection
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!id || !isAuthenticated || !token) return

    const connection = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL || 'https://localhost:7251'}/hubs/notifications`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build()

    connection.on('OrderStatusChanged', (orderId: string, newStatus: number) => {
      if (orderId === id) {
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ['order', id] })
        queryClient.invalidateQueries({ queryKey: ['myOrders'] })
      }
    })

    connection.start().catch(console.error)

    return () => {
      connection.stop()
    }
  }, [id, isAuthenticated])

  // Verify payment if pending
  useEffect(() => {
    if (order?.id && order.orderStatus === 0 && order.payment?.paymentMethod === 1) {
      apiClient(`/payments/verify/${order.id}`).then(() => {
        queryClient.invalidateQueries({ queryKey: ['order', order.id] })
        queryClient.invalidateQueries({ queryKey: ['myOrders'] })
      }).catch(console.error)
    }
  }, [order?.id, order?.orderStatus, order?.payment?.paymentMethod])

  if (isLoading) {
    return <div className="max-w-2xl mx-auto p-8 text-center mt-20">Đang tải chi tiết đơn hàng...</div>
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center text-red-500 mt-20">
        Lỗi khi tải chi tiết đơn hàng. <br/>
        <button onClick={() => navigate(ROUTES.MY_ORDERS)} className="mt-4 text-brand-600 font-bold underline">Quay lại danh sách</button>
      </div>
    )
  }

  const getStatusDisplay = (status: number) => {
    switch (status) {
      case 0: return { text: 'Chờ lấy hàng', color: 'text-orange-600 bg-orange-100' }
      case 1: return { text: 'Đã thanh toán', color: 'text-blue-600 bg-blue-100' }
      case 2: return { text: 'Đã hoàn thành', color: 'text-brand-700 bg-brand-100' }
      case 4: return { text: 'Đã huỷ', color: 'text-red-600 bg-red-100' }
      default: return { text: 'Không xác định', color: 'text-gray-600 bg-gray-100' }
    }
  }

  const status = getStatusDisplay(order.orderStatus)
  const isCompleted = order.orderStatus === 2
  const isCancelled = order.orderStatus === 4

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 mt-14 mb-20">
      <button 
        onClick={() => navigate(ROUTES.MY_ORDERS)} 
        className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 mr-1" /> Quay lại
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header - QR Code Area */}
        <div className={`p-8 text-center border-b border-gray-100 flex flex-col items-center ${isCompleted ? 'bg-brand-50' : isCancelled ? 'bg-red-50' : 'bg-gray-50'}`}>
          <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold mb-8 ${status.color}`}>
            {isCompleted && <CheckCircle className="w-4 h-4" />}
            {status.text}
          </div>

          {/* Stepper */}
          {!isCancelled && (
            <div className="w-full max-w-md mx-auto mb-10">
              <div className="flex justify-between items-center relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-500 rounded-full z-0 transition-all duration-500" 
                  style={{ width: isCompleted ? '100%' : (order.confirmedById || order.orderStatus >= 1) ? '50%' : '0%' }}
                ></div>

                {/* Step 1: Đặt hàng */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-500 text-white font-bold border-4 border-white shadow-sm">
                    1
                  </div>
                  <span className="text-xs font-bold mt-2 text-gray-800">Đặt hàng</span>
                </div>

                {/* Step 2: Xác nhận */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm transition-colors duration-500 ${(order.confirmedById || order.orderStatus >= 1) ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    2
                  </div>
                  <span className={`text-xs font-bold mt-2 ${(order.confirmedById || order.orderStatus >= 1) ? 'text-gray-800' : 'text-gray-400'}`}>Xác nhận</span>
                </div>

                {/* Step 3: Nhận hàng */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm transition-colors duration-500 ${isCompleted ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    3
                  </div>
                  <span className={`text-xs font-bold mt-2 ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>Nhận hàng</span>
                </div>
              </div>
            </div>
          )}

          {!isCompleted && !isCancelled && order.pickupCode && (
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 animate-[--animate-scale-in]">
              <QRCodeSVG value={order.id} size={200} />
            </div>
          )}

          {order.pickupCode && (
            <div className={!isCompleted && !isCancelled ? "animate-[--animate-slide-up]" : ""}>
              <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Mã nhận hàng</p>
              <h2 className="text-4xl font-[--font-display] font-bold tracking-widest text-gray-900">{order.pickupCode}</h2>
            </div>
          )}
        </div>

        {/* Store Info */}
        <div className="p-6 sm:p-8 border-b border-gray-100">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-gray-400" /> Cửa hàng
          </h3>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-bold text-gray-900 mb-1">{order.storeName}</p>
            <p className="text-sm text-gray-600 flex items-start gap-1">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              {order.storeAddress}
            </p>
          </div>
        </div>

        {/* Order Details */}
        <div className="p-6 sm:p-8 border-b border-gray-100">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-gray-400" /> Chi tiết đơn
          </h3>
          
          <div className="space-y-4 mb-6">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-gray-500">x{item.quantity}</p>
                </div>
                <div className="font-medium whitespace-nowrap">
                  {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-dashed border-gray-200">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Tổng thanh toán</span>
              <span className="text-brand-600">{order.totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="p-6 sm:p-8 bg-gray-50 text-sm text-gray-500 space-y-2">
          <div className="flex justify-between">
            <span>Mã đơn hàng:</span>
            <span className="font-mono text-gray-700">{order.orderCode || order.id.substring(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>Thời gian đặt:</span>
            <span>{dayjs(order.createdAt).format('HH:mm DD/MM/YYYY')}</span>
          </div>
          {order.payment && (
            <div className="flex justify-between">
              <span>Phương thức:</span>
              <span>{order.payment.paymentMethod === 1 ? 'Thanh toán Online' : 'Thanh toán tại quầy'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
