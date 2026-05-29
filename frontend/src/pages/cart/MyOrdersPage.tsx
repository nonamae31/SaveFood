import { Link, useNavigate } from 'react-router-dom'
import { useMyOrders } from '@/hooks/useOrders'
import { ROUTES } from '@/lib/constants'
import { Store, Clock, Package, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'

export function MyOrdersPage() {
  const { data: orders, isLoading, error } = useMyOrders()
  const navigate = useNavigate()

  if (isLoading) {
    return <div className="max-w-4xl mx-auto p-8 text-center mt-20">Đang tải danh sách đơn hàng...</div>
  }

  if (error) {
    return <div className="max-w-4xl mx-auto p-8 text-center text-red-500 mt-20">Lỗi khi tải đơn hàng.</div>
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center mt-20">
        <div className="bg-white rounded-2xl shadow-sm p-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Bạn chưa có đơn hàng nào</h2>
          <p className="text-gray-500 mb-6">Hãy khám phá các cửa hàng và đặt món ăn giải cứu nhé!</p>
          <Link to={ROUTES.HOME} className="bg-brand-500 text-white px-6 py-3 rounded-full font-bold hover:bg-brand-600 transition-colors">
            Khám phá ngay
          </Link>
        </div>
      </div>
    )
  }

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return { text: 'Chờ lấy hàng', color: 'text-orange-600 bg-orange-50' }
      case 1: return { text: 'Đã thanh toán', color: 'text-blue-600 bg-blue-50' }
      case 2: return { text: 'Đã hoàn thành', color: 'text-brand-700 bg-brand-50' }
      case 4: return { text: 'Đã huỷ', color: 'text-red-600 bg-red-50' }
      default: return { text: 'Không xác định', color: 'text-gray-600 bg-gray-50' }
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 mt-14">
      <h1 className="text-2xl font-bold mb-6 font-[--font-display]">Đơn hàng của tôi</h1>
      
      <div className="space-y-4">
        {orders.map((order) => {
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
      </div>
    </div>
  )
}
