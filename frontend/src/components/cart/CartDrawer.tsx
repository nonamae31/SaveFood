import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Store as StoreIcon, Trash2, Plus, Minus, ArrowRight, X } from 'lucide-react'
import { useCart, useUpdateCartItem, useRemoveFromCart } from '@/hooks/useCart'
import { ROUTES } from '@/lib/constants'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import type { CartItem } from '@/types/cart.types'
import { toast } from 'react-hot-toast'
import { useLocationContext } from '@/contexts/LocationContext'
import { calculateDistance } from '@/utils/distance'
import { useCartContext } from '@/contexts/CartContext'

export function CartDrawer() {
  const navigate = useNavigate()
  const { isCartOpen, closeCart } = useCartContext()
  const { data: cartItems, isLoading, isError, error, refetch } = useCart()
  const updateItemMutation = useUpdateCartItem()
  const removeItemMutation = useRemoveFromCart()
  const { location } = useLocationContext()

  const [selectedIds, setSelectedIds] = useState<string[]>([])

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
    
    const allSelected = storeItemIds.length > 0 && storeItemIds.every(id => selectedIds.includes(id))
    
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

  const handleCheckout = () => {
    closeCart()
    navigate(ROUTES.CHECKOUT, { state: { selectedCartItemIds: selectedIds } })
  }

  const selectedItems = cartItems?.filter(i => selectedIds.includes(i.id)) || []
  const totalPrice = selectedItems.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0)
  const validItemsCount = cartItems?.filter(i => !i.isExpired && i.availableQuantity > 0).length || 0
  const isAllSelected = selectedIds.length > 0 && selectedIds.length === validItemsCount

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />
      
      <div 
        className="fixed inset-y-0 right-0 z-[101] w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-[--color-ink-primary] flex items-center gap-2">
            <ShoppingCart size={24} className="text-brand-500" />
            Giỏ hàng
          </h2>
          <button 
            onClick={closeCart}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          ) : isError ? (
            <div className="p-4">
              <ErrorState error={error} title="Không thể tải giỏ hàng" onRetry={() => refetch()} />
            </div>
          ) : !cartItems || cartItems.length === 0 ? (
            <div className="py-20 px-4">
              <EmptyState 
                icon={ShoppingCart} 
                title="Giỏ hàng trống" 
                description="Chưa có món đồ nào trong giỏ hàng của bạn."
                action={
                  <button 
                    onClick={() => { closeCart(); navigate(ROUTES.PRODUCTS); }}
                    className="mt-4 px-6 py-2 bg-brand-500 text-white rounded-full font-bold hover:bg-brand-600 transition-colors"
                  >
                    Xem đồ ăn cận date
                  </button>
                }
              />
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {Object.entries(groupedCart).map(([storeId, storeGroup]) => {
                const storeItemIds = storeGroup.items.filter(i => !i.isExpired && i.availableQuantity > 0).map(i => i.id)
                const isAllStoreSelected = storeItemIds.length > 0 && storeItemIds.every(id => selectedIds.includes(id))

                return (
                  <div key={storeId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={isAllStoreSelected}
                        onChange={() => handleToggleStoreSelect(storeId)}
                        disabled={storeItemIds.length === 0}
                        className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:opacity-50 cursor-pointer"
                      />
                      <StoreIcon size={18} className="text-gray-500" />
                      <h3 className="font-bold text-gray-900 text-sm truncate">{storeGroup.storeName}</h3>
                    </div>

                    <div className="divide-y divide-gray-50">
                      {storeGroup.items.map(item => {
                        const isDisabled = item.isExpired || item.availableQuantity <= 0
                        const hasStockWarning = item.availableQuantity > 0 && item.quantity > item.availableQuantity
                        const isFar = location && item.storeLatitude && item.storeLongitude
                          ? calculateDistance(location.lat, location.lng, item.storeLatitude, item.storeLongitude) > 5
                          : false;

                        return (
                          <div key={item.id} className={`p-4 flex gap-3 ${isDisabled ? 'bg-red-50/30' : 'hover:bg-gray-50/50'}`}>
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(item.id)}
                              onChange={() => handleToggleSelect(item.id)}
                              disabled={isDisabled || hasStockWarning}
                              className="w-4 h-4 mt-1.5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:opacity-50 cursor-pointer"
                            />

                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.title}</h4>
                                  <button 
                                    onClick={() => handleRemove(item.id)}
                                    className="text-gray-400 hover:text-red-500 p-1 -mr-1 shrink-0 cursor-pointer"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                                <div className="mt-1 flex items-baseline gap-2">
                                  <span className="font-bold text-brand-600 text-sm">{item.salePrice.toLocaleString()}đ</span>
                                </div>
                              </div>

                              {!isDisabled && !hasStockWarning && (
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center border border-gray-200 rounded-md bg-white overflow-hidden h-7">
                                    <button 
                                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                      disabled={item.quantity <= 1 || updateItemMutation.isPending}
                                      className="w-7 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <span className="w-7 text-center text-xs font-medium">{item.quantity}</span>
                                    <button 
                                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                      disabled={item.quantity >= item.availableQuantity || updateItemMutation.isPending}
                                      className="w-7 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              {isDisabled && <p className="mt-1 text-xs font-medium text-red-500">Hết hạn/hết hàng</p>}
                              {hasStockWarning && <p className="mt-1 text-xs font-medium text-amber-600">Vượt quá tồn kho</p>}
                              {isFar && !isDisabled && <p className="mt-1 text-[10px] font-semibold text-orange-600">&gt; 5km</p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {cartItems && cartItems.length > 0 && (
          <div className="bg-white border-t border-gray-100 p-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => setSelectedIds(e.target.checked ? cartItems.filter(i => !i.isExpired && i.availableQuantity > 0).map(i => i.id) : [])}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-600">Tất cả ({validItemsCount})</span>
              </label>
              <div className="text-right">
                <span className="text-xs text-gray-500 block">Tổng cộng:</span>
                <span className="text-lg font-bold text-brand-600 leading-tight">{totalPrice.toLocaleString()}đ</span>
              </div>
            </div>
            
            <button
              disabled={selectedIds.length === 0}
              onClick={handleCheckout}
              className="w-full py-3 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Thanh toán ngay
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  )
}
