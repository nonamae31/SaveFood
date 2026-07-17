import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useOrder, useExtendPickup, useCancelOrder, useBatchPay, useConfirmReceipt, useRepurchase } from '@/hooks/useOrders'
import { ROUTES } from '@/lib/constants'
import { Store, Clock, Package, CheckCircle, ChevronLeft, MapPin, ReceiptText, AlertCircle, X, Star, ExternalLink, Handshake, Loader2 } from 'lucide-react'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import dayjs from 'dayjs'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { HubConnectionBuilder } from '@microsoft/signalr'
import { queryClient } from '@/lib/queryClient'
import { useAuthContext } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/apiClient'
import toast from 'react-hot-toast'

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
    <span className="text-orange-600 font-bold flex items-center gap-1 ml-2">
      <Clock size={16} /> {m}:{s.toString().padStart(2, '0')}
    </span>
  )
}

export function OrderDetailPage() {
  const { id: pathId } = useParams()
  const [searchParams] = useSearchParams()
  const id = pathId || searchParams.get('orderId') || ''
  const { data: order, isLoading, error } = useOrder(id)
  const extendMutation = useExtendPickup(id)
  const cancelMutation = useCancelOrder(id)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthContext()
  const batchPayMutation = useBatchPay()
  const repurchaseMutation = useRepurchase(id)
  const handleRepurchase = () => {
    repurchaseMutation.mutate(undefined, {
      onSuccess: (res) => {
        toast.success(res.message || "Đã thêm vào giỏ hàng");
        navigate(ROUTES.CART);
      },
      onError: (err: any) => {
        toast.error(err.message || 'Không thể mua lại.');
      }
    });
  }

  const handleRetryPayment = () => {
    batchPayMutation.mutate(
      { 
        orderIds: [id],
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

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelForm, setCancelForm] = useState({ reason: '' })
  const [reviewingItem, setReviewingItem] = useState<{ id: string; title: string } | null>(null)

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelForm.reason.trim()) {
      toast.error("Vui lòng nhập lý do hủy đơn.");
      return;
    }

    cancelMutation.mutate(cancelForm, {
      onSuccess: (res) => {
        toast.success(res.message || "Hủy đơn thành công");
        setIsCancelModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['order', id] });
        queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      },
      onError: (err: any) => {
        toast.error(err.message || 'Có lỗi xảy ra khi hủy đơn.');
      }
    });
  };

  const handleExtend = (minutes: number) => {
    extendMutation.mutate(minutes, {
      onSuccess: (res) => {
        toast.success(res.message || `Đã gia hạn thêm ${minutes} phút`);
        queryClient.invalidateQueries({ queryKey: ['order', id] });
      },
      onError: (err: any) => {
        toast.error(err.message || 'Có lỗi xảy ra khi gia hạn.');
      }
    });
  };

  const confirmReceiptMutation = useConfirmReceipt()

  const handleConfirmReceipt = () => {
    confirmReceiptMutation.mutate(id, {
      onSuccess: (res: any) => {
        toast.success(res.message || 'Xác nhận nhận hàng thành công!')
        queryClient.invalidateQueries({ queryKey: ['order', id] })
        queryClient.invalidateQueries({ queryKey: ['myOrders'] })
      },
      onError: (err: any) => {
        toast.error(err.message || 'Có lỗi xảy ra khi xác nhận nhận hàng.')
      }
    })
  }

  // Lắng nghe sự kiện cập nhật trạng thái
  useEffect(() => {
    const token = localStorage.getItem('sf_access_token') || localStorage.getItem('accessToken');
    if (!id || !isAuthenticated || !token) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${(import.meta.env.VITE_API_BASE_URL || 'https://localhost:7251/api').replace('/api', '')}/hubs/notifications`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connection.on('OrderStatusUpdated', (orderId: string, newStatus: number) => {
      if (orderId === id) {
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ['order', id] });
        queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      }
    });

    connection.start().catch(console.error);

    return () => {
      connection.stop();
    };
  }, [id, isAuthenticated]);

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

  const getStatusDisplay = (status: number, paymentMethod?: number, paymentStatus?: number) => {
    switch (status) {
      case 0: return { text: paymentMethod === 1 && (paymentStatus === 0 || paymentStatus === 2) ? 'Chờ thanh toán' : 'Chờ xác nhận', color: 'text-orange-600 bg-orange-100' }
      case 1: return { text: 'Đã xác nhận', color: 'text-blue-600 bg-blue-100' }
      case 2: return { text: 'Chờ lấy hàng', color: 'text-indigo-600 bg-indigo-100' }
      case 3: return { text: 'Đã hoàn thành', color: 'text-brand-700 bg-brand-100' }
      case 4: return { text: 'Đã huỷ', color: 'text-red-600 bg-red-100' }
      case 5: return { text: 'Chờ xác nhận nhận hàng', color: 'text-orange-600 bg-orange-100' }
      default: return { text: 'Không xác định', color: 'text-gray-600 bg-gray-100' }
    }
  }

  const status = getStatusDisplay(order.orderStatus, order.payment?.paymentMethod, order.payment?.status)
  const isCompleted = order.orderStatus === 3
  const isCancelled = order.orderStatus === 4
  const isAwaitingConfirm = order.orderStatus === 5

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
            {order.orderStatus === 0 && order.reservationExpiresAt && (
              <PaymentCountdown expiresAt={order.reservationExpiresAt} />
            )}
          </div>

          {/* Stepper */}
          {!isCancelled && (
            <div className="w-full max-w-md mx-auto mb-10">
              <div className="flex justify-between items-center relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-500 rounded-full z-0 transition-all duration-500" 
                  style={{ width: order.orderStatus >= 3 ? '100%' : order.orderStatus === 5 ? '83.33%' : order.orderStatus >= 2 ? '66.66%' : order.orderStatus >= 1 ? '33.33%' : '0%' }}
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm transition-colors duration-500 ${order.orderStatus >= 1 ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    2
                  </div>
                  <span className={`text-xs font-bold mt-2 ${order.orderStatus >= 1 ? 'text-gray-800' : 'text-gray-400'}`}>Xác nhận</span>
                </div>

                {/* Step 3: Chờ lấy hàng */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm transition-colors duration-500 ${order.orderStatus >= 2 ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    3
                  </div>
                  <span className={`text-xs font-bold mt-2 ${order.orderStatus >= 2 ? 'text-gray-800' : 'text-gray-400'}`}>Chờ lấy hàng</span>
                </div>

                {/* Step 4: Nhận hàng */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm transition-colors duration-500 ${order.orderStatus >= 3 ? 'bg-brand-500 text-white' : order.orderStatus === 5 ? 'bg-orange-500 text-white animate-pulse' : 'bg-gray-200 text-gray-400'}`}>
                    4
                  </div>
                  <span className={`text-xs font-bold mt-2 ${order.orderStatus >= 3 ? 'text-gray-800' : order.orderStatus === 5 ? 'text-orange-600' : 'text-gray-400'}`}>Nhận hàng</span>
                </div>
              </div>
            </div>
          )}

          {!isCompleted && !isCancelled && order.pickupCode && (
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 animate-[--animate-scale-in]">
              <QRCodeSVG value={`pickupCode=${order.pickupCode}`} size={200} />
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
            <p className="font-bold text-gray-900 mb-2">{order.storeName}</p>
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.storeAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-start sm:items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors border border-blue-100 shadow-sm"
              title="Xem bản đồ trên Google Maps"
            >
              <MapPin className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
              <span className="flex-1 text-left line-clamp-2">{order.storeAddress}</span>
              <ExternalLink className="w-4 h-4 shrink-0 opacity-70 ml-1" />
            </a>
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
                  <Link to={ROUTES.PRODUCT_DETAIL(item.listingId)} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-brand-500 transition-colors inline-block">{item.title}</Link>
                  <p className="text-sm text-gray-500">x{item.quantity}</p>
                </div>
                <div className="flex items-center gap-3">
                  {isCompleted && (
                    <button
                      onClick={() => setReviewingItem({ id: item.id, title: item.title })}
                      className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Star size={12} className="fill-amber-500" /> Đánh giá
                    </button>
                  )}
                  <div className="font-medium whitespace-nowrap">
                    {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-dashed border-gray-200 space-y-2">
            <div className="flex justify-between items-center text-gray-600">
              <span>Tổng tiền hàng</span>
              <span className="font-medium">{order.totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            {(order.voucherDiscount ?? 0) > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span>Voucher SaveFood</span>
                <span className="font-medium">-{(order.voucherDiscount!).toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-100">
              <span>Tổng thanh toán</span>
              <span className="text-brand-600">{(order.totalAmount - (order.voucherDiscount || 0)).toLocaleString('vi-VN')} đ</span>
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
          {order.expectedPickupTime && (
            <div className="flex flex-col gap-2 border-t border-gray-100 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-medium text-brand-700">Giờ lấy hàng dự kiến:</span>
                <span className="font-bold text-brand-700">{dayjs(order.expectedPickupTime).format('HH:mm DD/MM/YYYY')}</span>
              </div>
              {order.orderStatus === 1 && (
                <div className="flex gap-2 justify-end mt-1">
                  <span className="text-xs text-gray-500 self-center mr-2">Gia hạn:</span>
                  <button onClick={() => handleExtend(30)} disabled={extendMutation.isPending} className="text-xs bg-brand-100 text-brand-700 px-3 py-1.5 rounded hover:bg-brand-200 transition-colors disabled:opacity-50">+30 Phút</button>
                  <button onClick={() => handleExtend(60)} disabled={extendMutation.isPending} className="text-xs bg-brand-100 text-brand-700 px-3 py-1.5 rounded hover:bg-brand-200 transition-colors disabled:opacity-50">+60 Phút</button>
                </div>
              )}
            </div>
          )}
          {order.payment && (
            <div className="flex justify-between">
              <span>Phương thức:</span>
              <span>{order.payment.paymentMethod === 1 ? 'Thanh toán trực tuyến (PayOS)' : 'Ví SaveFood'}</span>
            </div>
          )}

          {order.orderStatus === 0 || order.orderStatus === 3 || order.orderStatus === 4 ? (
            <div className="pt-6 mt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
              {order.orderStatus === 3 && (
                <button 
                  onClick={() => navigate(`/complaints/new?orderId=${pathId}`)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl border-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600 font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                >
                  <AlertCircle className="w-5 h-5" /> Gửi khiếu nại
                </button>
              )}

              {order.orderStatus === 0 && (
                <button 
                  onClick={() => setIsCancelModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl border-2 border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600 font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                >
                  <AlertCircle className="w-5 h-5" /> Hủy đơn hàng
                </button>
              )}
              
              {order.orderStatus === 0 && order.payment?.paymentMethod === 1 && (order.payment?.status === 0 || order.payment?.status === 2) && (
                <button 
                  onClick={handleRetryPayment}
                  disabled={batchPayMutation.isPending}
                  className="w-full sm:w-auto bg-brand-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {batchPayMutation.isPending ? 'Đang chuyển hướng...' : 'Tiếp tục thanh toán'}
                </button>
              )}
              
              {order.orderStatus === 5 && (
                <button 
                  onClick={handleConfirmReceipt}
                  disabled={confirmReceiptMutation.isPending}
                  className="w-full sm:w-auto bg-green-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" /> {confirmReceiptMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đã nhận hàng'}
                </button>
              )}

              {(order.orderStatus === 3 || order.orderStatus === 4) && (
                <button 
                  onClick={handleRepurchase}
                  disabled={repurchaseMutation.isPending}
                  className="w-full sm:w-auto bg-brand-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" /> {repurchaseMutation.isPending ? 'Đang xử lý...' : 'Mua lại đơn này'}
                </button>
              )}
            </div>
          ) : null}

          {isAwaitingConfirm && (
            <div className="pt-6 mt-4 border-t border-gray-100">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-orange-800 font-medium flex items-center gap-2">
                  <Handshake className="w-5 h-5 shrink-0" />
                  Cửa hàng đã xác nhận bạn đến lấy hàng. Vui lòng xác nhận bạn đã nhận hàng để hoàn tất đơn hàng.
                </p>
              </div>
              <button
                onClick={handleConfirmReceipt}
                disabled={confirmReceiptMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-base transition-all shadow-lg shadow-green-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {confirmReceiptMutation.isPending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Đang xác nhận...</>
                ) : (
                  <><Handshake className="w-5 h-5" /> Xác nhận đã nhận hàng</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Order Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-[--animate-fade-in]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-[--animate-scale-in]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="text-red-500 w-6 h-6" /> Hủy Đơn Hàng
              </h3>
              <button onClick={() => setIsCancelModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="p-4 rounded-xl mb-6 text-sm bg-green-50 text-green-800 border border-green-200">
                <p className="font-bold mb-1">
                  Đơn hàng đang chờ cửa hàng xác nhận
                </p>
                <p>
                  Tiền của bạn sẽ được hoàn <strong>100%</strong> về <strong>Ví SaveFood</strong> ngay lập tức.
                </p>
              </div>

              <form onSubmit={handleCancelSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lý do hủy đơn *</label>
                  <textarea 
                    required
                    value={cancelForm.reason}
                    onChange={(e) => setCancelForm(prev => ({...prev, reason: e.target.value}))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all resize-none h-24"
                    placeholder="Vui lòng cho biết lý do bạn hủy..."
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={cancelMutation.isPending}
                  className="w-full mt-6 bg-red-500 text-white font-bold py-3.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {cancelMutation.isPending ? 'Đang xử lý...' : 'Xác nhận hủy đơn hàng'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewingItem && (
        <ReviewForm
          orderItemId={reviewingItem.id}
          orderItemTitle={reviewingItem.title}
          onClose={() => setReviewingItem(null)}
        />
      )}
    </div>
  )
}
