import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, Store as StoreIcon, Trash2, Plus, Minus, ArrowRight, Loader2 } from 'lucide-react'
import { useCart, useUpdateCartItem, useRemoveFromCart } from '@/hooks/useCart'
import { ROUTES } from '@/lib/constants'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import type { CartItem } from '@/types/cart.types'
import { toast } from 'react-hot-toast'
import { MapPin } from 'lucide-react'
import { useLocationContext } from '@/contexts/LocationContext'
import { calculateDistance } from '@/utils/distance'
import { apiClient } from '@/lib/apiClient'

export function CartPage() {
  const navigate = useNavigate()
  const { data: cartItems, isLoading, isError, error, refetch } = useCart()
  const updateItemMutation = useUpdateCartItem()
  const removeItemMutation = useRemoveFromCart()
  const { location } = useLocationContext()
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)

  // Manage selection (array of selected listingIds or cartItemIds)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Group items by Store
  const groupedCart = useMemo(() => {
    if (!cartItems) return {}
    return cartItems.reduce((acc, item) => {
      if (!acc[item.storeId]) {
        acc[item.storeId] = { storeName: item.storeName, items: [] }
      }
      acc[item.storeId].items.push(item)
      return acc
    }, {} as Record<string, { storeName: string; items: CartItem[] }>)
  }, [cartItems])

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleToggleStoreSelect = (storeId: string) => {
    const storeItems = groupedCart[storeId]?.items || []
    const storeItemIds = storeItems.filter(i => !i.isExpired && i.availableQuantity > 0).map(i => i.id)
    
    const allSelected = storeItemIds.every(id => selectedIds.includes(id))
    
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !storeItemIds.includes(id)))
    } else {
      setSelectedIds(prev => {
        const set = new Set([...prev, ...storeItemIds])
        return Array.from(set)
      })
    }
  }

  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return
    if (newQuantity > item.availableQuantity) {
      toast.error(`Chỉ còn ${item.availableQuantity} sản phẩm trong kho.`)
      return
    }
    updateItemMutation.mutate({ id: item.id, req: { quantity: newQuantity } })
  }

  const handleRemove = (id: string) => {
    removeItemMutation.mutate(id)
    setSelectedIds(prev => prev.filter(x => x !== id))
  }

  const selectedItems = cartItems?.filter(i => selectedIds.includes(i.id)) || []
  const totalPrice = selectedItems.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0)

  if (isLoading) {
    return (
      <div className="max-w-[--spacing-container] mx-auto px-4 py-8">
        <div className="animate-pulse flex flex-col gap-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-40 bg-gray-200 rounded-xl"></div>
          <div className="h-40 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-12">
        <ErrorState error={error} title="Không thể tải giỏ hàng" onRetry={() => refetch()} />
      </div>
    )
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="py-20">
        <EmptyState 
          icon={ShoppingCart} 
          title="Giỏ hàng trống" 
          description="Chưa có món đồ nào trong giỏ hàng của bạn. Hãy dạo quanh các cửa hàng và tìm món ngon nhé!"
          action={
            <button 
              onClick={() => navigate(ROUTES.PRODUCTS)}
              className="px-6 py-2.5 bg-brand-500 text-white rounded-full font-bold hover:bg-brand-600 transition-colors"
            >
              Xem đồ ăn cận date
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
      <h1 className="text-[--text-heading-lg] font-bold text-[--color-ink-primary] mb-6 flex items-center gap-3">
        <ShoppingCart size={28} className="text-brand-500" />
        Giỏ hàng của bạn
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Cart Items */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {Object.entries(groupedCart).map(([storeId, storeGroup]) => {
            const storeItemIds = storeGroup.items.filter(i => !i.isExpired && i.availableQuantity > 0).map(i => i.id)
            const isAllStoreSelected = storeItemIds.length > 0 && storeItemIds.every(id => selectedIds.includes(id))

            return (
              <div key={storeId} className="bg-white rounded-2xl shadow-[--shadow-card] border border-gray-100 overflow-hidden">
                {/* Store Header */}
                <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={isAllStoreSelected}
                    onChange={() => handleToggleStoreSelect(storeId)}
                    disabled={storeItemIds.length === 0}
                    className="w-5 h-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:opacity-50 cursor-pointer"
                  />
                  <StoreIcon size={20} className="text-[--color-ink-secondary]" />
                  <h3 className="font-bold text-[--color-ink-primary] text-[--text-body-lg]">{storeGroup.storeName}</h3>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-50">
                  {storeGroup.items.map(item => {
                    const isDisabled = item.isExpired || item.availableQuantity <= 0
                    const hasStockWarning = item.availableQuantity > 0 && item.quantity > item.availableQuantity
                    const isFar = location && item.storeLatitude && item.storeLongitude
                      ? calculateDistance(location.lat, location.lng, item.storeLatitude, item.storeLongitude) > 5
                      : false;

                    return (
                      <div key={item.id} className={`p-5 flex items-start gap-4 transition-colors ${isDisabled ? 'bg-red-50/50' : 'hover:bg-gray-50/50'}`}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleToggleSelect(item.id)}
                          disabled={isDisabled || hasStockWarning}
                          className="w-5 h-5 mt-3 rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:opacity-50 cursor-pointer"
                        />

                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">No Img</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-4">
                            <Link to={ROUTES.PRODUCT_DETAIL(item.listingId)} target="_blank" rel="noopener noreferrer" className="font-bold text-[--color-ink-primary] text-base truncate pr-4 hover:text-brand-500 transition-colors inline-block max-w-[80%]">
                              {item.title}
                            </Link>
                            <button 
                              onClick={() => handleRemove(item.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="font-bold text-brand-600 text-lg">{item.salePrice.toLocaleString()}đ</span>
                            <span className="text-sm text-[--color-ink-tertiary] line-through">{item.originalPrice.toLocaleString()}đ</span>
                          </div>

                          {isFar && !isDisabled && (
                            <p className="mt-1 text-xs font-semibold text-orange-600 flex items-center gap-1">
                              <MapPin size={12} /> Cửa hàng cách xa &gt; 5km (Hãy lưu ý thời gian di chuyển)
                            </p>
                          )}

                          {/* Cảnh báo */}
                          {isDisabled && (
                            <p className="mt-2 text-sm font-medium text-red-500">Sản phẩm đã hết hạn hoặc hết hàng.</p>
                          )}
                          
                          {!isDisabled && hasStockWarning && (
                            <p className="mt-2 text-sm font-medium text-amber-600">
                              Chỉ còn {item.availableQuantity} sản phẩm trong kho. Vui lòng giảm số lượng.
                            </p>
                          )}
                          
                          {!isDisabled && (
                            <div className="mt-3 flex items-center gap-4">
                              <div className="flex items-center border border-gray-200 rounded-full bg-white overflow-hidden">
                                <button 
                                  onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                  disabled={item.quantity <= 1 || updateItemMutation.isPending}
                                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <button 
                                  onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                  disabled={item.quantity >= item.availableQuantity || updateItemMutation.isPending}
                                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <span className="text-sm text-gray-500">Còn {item.availableQuantity} phần</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Right column: Checkout Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-[--shadow-card] border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-[--color-ink-primary] mb-4">Tổng quan đơn hàng</h2>
            
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === cartItems.filter(i => !i.isExpired && i.availableQuantity > 0).length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(cartItems.filter(i => !i.isExpired && i.availableQuantity > 0).map(i => i.id))
                    } else {
                      setSelectedIds([])
                    }
                  }}
                  className="w-5 h-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-600">Chọn tất cả ({cartItems.filter(i => !i.isExpired && i.availableQuantity > 0).length})</span>
              </label>
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-500">Tổng thanh toán ({selectedIds.length} món):</span>
              <span className="text-2xl font-bold text-brand-600">{totalPrice.toLocaleString()}đ</span>
            </div>
            
            <button
              disabled={selectedIds.length === 0 || isCheckingAvailability}
              onClick={async () => {
                if (selectedIds.length === 0) return
                setIsCheckingAvailability(true)
                try {
                  const result = await apiClient<{
                    canProceed: boolean
                    items: Array<{ cartItemId: string; title: string; requestedQuantity: number; availableQuantity: number; isAvailable: boolean }>
                  }>('/orders/check-availability', {
                    method: 'POST',
                    body: JSON.stringify(selectedIds)
                  })

                  if (!result.canProceed) {
                    const soldOut = result.items
                      .filter(i => !i.isAvailable)
                      .map(i => `"${i.title}" (cần ${i.requestedQuantity}, còn ${i.availableQuantity})`)
                      .join(', ')
                    toast.error(`Không đủ hàng: ${soldOut}. Vui lòng cập nhật giỏ hàng.`, { duration: 5000 })
                    refetch()
                    return
                  }

                  navigate(ROUTES.CHECKOUT, { state: { selectedCartItemIds: selectedIds } })
                } catch (err: any) {
                  toast.error(err?.message || 'Không thể kiểm tra hàng. Vui lòng thử lại.')
                } finally {
                  setIsCheckingAvailability(false)
                }
              }}
              className="w-full py-4 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              {isCheckingAvailability ? (
                <><Loader2 size={20} className="animate-spin" /> Đang kiểm tra...</>
              ) : (
                <>Mua hàng ngay <ArrowRight size={20} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
