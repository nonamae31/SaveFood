import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useCart } from '@/hooks/useCart'
import { apiClient } from '@/lib/apiClient'
import { ROUTES } from '@/lib/constants'

// Placeholder for API
const checkoutApi = {
  checkout: async (data: { cartItemIds: string[], paymentMethod: number }) => {
    return apiClient<{ orderId: string, pickupCode: string, checkoutUrl?: string, reservationExpiresAt?: string }>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [paymentMethod, setPaymentMethod] = useState<number>(1) // Default to PayOS
  
  // Assuming we pass selected items from Cart via state
  const selectedItemIds = location.state?.selectedCartItemIds as string[] || []

  const { data: cartItems, isLoading } = useCart()

  const checkoutMutation = useMutation({
    mutationFn: checkoutApi.checkout,
    onSuccess: (res) => {
      if (res.checkoutUrl) {
        // Redirect to PayOS
        window.location.href = res.checkoutUrl
      } else {
        // Redirect to success page for Pay at Counter
        navigate(`/orders/${res.orderId}`, { 
          state: { 
            pickupCode: res.pickupCode,
            isNewOrder: true
          } 
        })
      }
    },
    onError: (error: any) => {
      alert(error.message || 'Có lỗi xảy ra khi thanh toán.')
    }
  })

  if (isLoading) return <div className="p-8 text-center">Đang tải...</div>

  const checkoutItems = cartItems?.filter(item => selectedItemIds.includes(item.id)) || []
  
  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <p className="mb-4">Bạn chưa chọn sản phẩm nào để thanh toán.</p>
        <button onClick={() => navigate(ROUTES.CART)} className="bg-brand-500 text-white px-4 py-2 rounded">
          Quay lại Giỏ hàng
        </button>
      </div>
    )
  }

  const totalAmount = checkoutItems.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0)
  const storeName = checkoutItems[0]?.storeName // Assuming all from same store

  const handleCheckout = () => {
    checkoutMutation.mutate({
      cartItemIds: selectedItemIds,
      paymentMethod
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Sản phẩm từ: {storeName}</h2>
            <div className="space-y-4">
              {checkoutItems.map(item => (
                <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                  <img src={item.imageUrl} alt={item.title} className="w-20 h-20 object-cover rounded-md" />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                    <p className="text-brand-600 font-medium">
                      {(item.salePrice * item.quantity).toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value={1} 
                  checked={paymentMethod === 1}
                  onChange={() => setPaymentMethod(1)}
                  className="w-4 h-4 text-brand-500"
                />
                <span>Thanh toán Online (PayOS / VietQR)</span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value={0} 
                  checked={paymentMethod === 0}
                  onChange={() => setPaymentMethod(0)}
                  className="w-4 h-4 text-brand-500"
                />
                <span>Thanh toán tại quầy khi nhận hàng</span>
              </label>
            </div>
            {paymentMethod === 1 && (
              <p className="mt-3 text-sm text-amber-600">
                * Sau khi nhấn thanh toán, bạn sẽ có 10 phút để hoàn tất chuyển khoản. Đơn hàng sẽ bị huỷ nếu quá hạn.
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Tổng cộng</h2>
            <div className="flex justify-between mb-2">
              <span>Tạm tính</span>
              <span>{totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-4 mt-4">
              <span>Tổng tiền</span>
              <span className="text-brand-600">{totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            
            <button
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending}
              className="w-full mt-6 bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {checkoutMutation.isPending ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
