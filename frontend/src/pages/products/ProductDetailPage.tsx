// ─── ProductDetailPage ───────────────────────────────────────────────────────
// Route: /products/:id
// Trang chi tiết Clearance Listing.
//
// Vì Backend chưa có GET /api/listings/{id}, ta tận dụng React Query cache:
// 1. Lấy từ cache (nếu user navigate từ list page) → render ngay, 0 network call
// 2. Nếu không có cache → fetch toàn bộ list và tìm theo id
// 3. Nếu vẫn không tìm thấy → hiển thị Not Found

import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight, ChevronLeft, Store, ShoppingCart, ShoppingBag,
  Package, Hash, AlertTriangle, Leaf,
} from 'lucide-react'
import { ExpiryLabel } from '@/components/ui/ExpiryLabel'
import { DiscountTag } from '@/components/ui/DiscountTag'
import { ListingCard } from '@/components/listings/ListingCard'
import { useListings } from '@/hooks/useListings'
import { useStoreDetail } from '@/hooks/useStores'
import { LISTING_QUERY_KEYS } from '@/hooks/useListings'
import { ROUTES } from '@/lib/constants'
import { formatVND, calcDiscountPercent } from '@/lib/formatters'
import type { CustomerListingDTO } from '@/types/listing.types'
import { useAddToCart } from '@/hooks/useCart'
import { toast } from 'react-hot-toast'
import { MapPin } from 'lucide-react'
import { useLocationContext } from '@/contexts/LocationContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { calculateDistance } from '@/utils/distance'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const addToCartMutation = useAddToCart()

  // ── Bước 1: Thử tìm trong cache React Query ──
  // Duyệt tất cả các query có key bắt đầu với ['listings', 'list']
  const queriesData = queryClient.getQueriesData<CustomerListingDTO[]>({
    queryKey: LISTING_QUERY_KEYS.all,
  })

  let cachedListing: CustomerListingDTO | undefined
  for (const [, data] of queriesData) {
    if (Array.isArray(data)) {
      const found = data.find(l => l.id === id)
      if (found) { cachedListing = found; break }
    }
  }

  // ── Bước 2: Nếu không có cache → fetch toàn bộ list ──
  const { data: allListings, isLoading } = useListings({})
  const listing = cachedListing ?? allListings?.find(l => l.id === id)

  // ── Bước 3: Related listings (cùng storeId, loại trừ chính nó) ──
  const relatedListings = allListings
    ?.filter(l => l.storeId === listing?.storeId && l.id !== listing?.id)
    .slice(0, 4) ?? []

  const discount = listing ? calcDiscountPercent(listing.originalPrice, listing.salePrice) : 0
  const isLowStock = listing && listing.quantityAvailable <= 3 && listing.quantityAvailable > 0
  const isSoldOut = listing && listing.quantityAvailable === 0
  
  const { user } = useAuthContext()
  const isMyStore = user?.storeId === listing?.storeId
  const isStoreClosed = listing?.storeStatus !== 0
  
  const { location } = useLocationContext()
  const { data: store } = useStoreDetail(listing?.storeId)
  
  const isFar = listing && store && store.latitude && store.longitude && location
    ? calculateDistance(location.lat, location.lng, store.latitude, store.longitude) > 5
    : false;

  const [showDistanceModal, setShowDistanceModal] = useState<{ isOpen: boolean; action?: 'add_to_cart' | 'buy_now' }>({ isOpen: false });

  const handleAddToCart = () => {
    addToCartMutation.mutate({ listingId: listing!.id, quantity: 1 }, {
      onSuccess: () => {
        toast.success('Đã thêm vào giỏ hàng')
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng')
      }
    })
  }

  const handleBuyNow = () => {
    addToCartMutation.mutate({ listingId: listing!.id, quantity: 1 }, {
      onSuccess: (cartItem) => {
        navigate(ROUTES.CHECKOUT, { state: { selectedCartItemIds: [cartItem.id] } })
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng')
      }
    })
  }

  const onActionClick = (action: 'add_to_cart' | 'buy_now') => {
    if (isFar) {
      setShowDistanceModal({ isOpen: true, action });
    } else {
      if (action === 'add_to_cart') handleAddToCart();
      else handleBuyNow();
    }
  }

  // ── Loading state ──
  if (isLoading && !cachedListing) {
    return (
      <div className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-[--color-surface-muted] rounded-full w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-72 bg-[--color-surface-muted] rounded-[--radius-card]" />
            <div className="space-y-4">
              <div className="h-6 bg-[--color-surface-muted] rounded-full w-3/4" />
              <div className="h-4 bg-[--color-surface-muted] rounded-full w-1/2" />
              <div className="h-8 bg-[--color-surface-muted] rounded-full w-1/3" />
              <div className="h-10 bg-[--color-surface-muted] rounded-[--radius-button] w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Not Found state ──
  if (!isLoading && !listing) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-20 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[--color-surface-muted] mb-4">
            <Package size={28} className="text-[--color-ink-tertiary]" />
          </div>
          <h1 className="text-[--text-heading-xl] font-bold text-[--color-ink-primary] mb-2">
            Không tìm thấy sản phẩm
          </h1>
          <p className="text-[--text-body-md] text-[--color-ink-secondary] mb-6">
            Tin đăng này không tồn tại hoặc đã bị gỡ xuống.
          </p>
          <Link
            to={ROUTES.PRODUCTS}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[--radius-button]
                         bg-[--color-brand-600] text-white font-semibold text-[--text-body-sm]
                         hover:bg-[--color-brand-700] transition-colors"
          >
            Xem tất cả sản phẩm
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[--text-body-sm] text-[--color-ink-secondary] overflow-x-auto whitespace-nowrap pb-2 hide-scrollbar">
          <Link to={ROUTES.HOME} className="hover:text-[--color-brand-600] transition-colors flex items-center gap-1 shrink-0">
            <Leaf size={13} aria-hidden="true" />
            Trang chủ
          </Link>
          <ChevronRight size={13} aria-hidden="true" className="shrink-0" />
          <Link to={ROUTES.PRODUCTS} className="hover:text-[--color-brand-600] transition-colors shrink-0">
            Đồ ăn cận date
          </Link>
          <ChevronRight size={13} aria-hidden="true" className="shrink-0" />
          <span className="text-[--color-ink-primary] font-medium truncate max-w-[200px] shrink-0">
            {listing!.title}
          </span>
        </nav>

        {/* ── Main Content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* ── Ảnh sản phẩm ── */}
          <div className="flex flex-col gap-4 w-full">
            <div className="relative rounded-[2rem] shadow-sm overflow-hidden
                              bg-gradient-to-br from-[--color-brand-50] to-[--color-brand-100]
                              flex items-center justify-center h-[400px] lg:h-[500px] w-full shrink-0 group">
              {listing!.images && listing!.images.length > 0 ? (
                <>
                  <img
                    src={listing!.images[currentImageIndex]}
                    alt={listing!.title}
                    className="w-full h-full object-cover"
                  />
                  {listing!.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex(prev => (prev === 0 ? listing!.images!.length - 1 : prev - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex(prev => (prev === listing!.images!.length - 1 ? 0 : prev + 1))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight size={20} />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {listing!.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'
                              }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : listing!.imageUrl ? (
                <img src={listing!.imageUrl} alt={listing!.title} className="w-full h-full object-contain p-4" />
              ) : listing!.isSurpriseBag ? (
                <div className="flex flex-col items-center gap-3 text-[--color-brand-600] py-12">
                  <ShoppingBag size={80} strokeWidth={1} />
                  <p className="text-[--text-heading-sm] font-bold">Túi Bất Ngờ</p>
                  <p className="text-[--text-body-sm] text-[--color-ink-secondary] text-center max-w-xs px-4">
                    Nội dung sẽ được tiết lộ khi bạn nhận hàng!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-[--color-brand-500] py-12">
                  <Package size={80} strokeWidth={1} />
                  <p className="text-[--text-body-sm] text-[--color-ink-tertiary]">Hình ảnh sản phẩm</p>
                </div>
              )}

              {/* Discount badge */}
              {discount > 0 && (
                <div className="absolute top-4 left-4 z-10">
                  <DiscountTag percent={discount} size="lg" />
                </div>
              )}

              {(isSoldOut || isStoreClosed) && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <span className="text-[--text-heading-sm] font-bold text-[--color-ink-tertiary]">
                    {isStoreClosed ? 'Tạm đóng cửa' : 'Đã hết hàng'}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {listing!.images && listing!.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {listing!.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${idx === currentImageIndex ? 'border-[--color-brand-600]' : 'border-transparent hover:border-gray-300'
                      }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Thông tin chi tiết ── */}
          <div className="flex flex-col gap-5 w-full">

            {isFar && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800">
                <MapPin className="shrink-0 mt-0.5 text-orange-600" size={20} />
                <div className="text-sm leading-relaxed">
                  <p className="font-bold mb-1">Cửa hàng cách xa hơn 5km</p>
                  <p>Vui lòng cân nhắc khoảng cách. Hãy đảm bảo bạn có thể đến lấy hàng đúng thời gian quy định để tránh bị hủy đơn và mất tiền (không hỗ trợ hoàn tiền).</p>
                </div>
              </div>
            )}

            {/* Tên + cửa hàng */}
            <div>
              {listing!.isSurpriseBag && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 mb-2 rounded-[--radius-badge]
                                   bg-amber-100 text-amber-700 text-[--text-body-sm] font-semibold">
                  🎁 Surprise Bag
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[--color-ink-primary] font-[--font-display] leading-tight mb-2">
                {listing!.title}
              </h1>
              <div className="flex items-center gap-1.5 text-[--text-body-sm] text-[--color-ink-secondary]">
                <Store size={14} strokeWidth={2} aria-hidden="true" />
                <Link
                  to={`/stores/${listing!.storeId}`}
                  className="hover:text-[--color-brand-600] transition-colors font-medium"
                >
                  {listing!.storeName}
                </Link>
              </div>
            </div>

            {/* Expiry label */}
            <div>
              <ExpiryLabel expiresAt={listing!.expiryDate} size="md" />
            </div>

            {/* Giá */}
            <div className="flex items-baseline gap-3">
              <span className="text-[--text-heading-xl] font-extrabold text-[--color-brand-700]">
                {formatVND(listing!.salePrice)}
              </span>
              {discount > 0 && (
                <span className="text-[--text-body-lg] text-[--color-ink-tertiary] line-through">
                  {formatVND(listing!.originalPrice)}
                </span>
              )}
            </div>

            {/* Số lượng */}
            <div className="flex items-center gap-2 p-3 rounded-[--radius-button]
                              bg-[--color-surface-muted] border border-[--color-surface-border]">
              <Hash size={15} strokeWidth={2.5} className="text-[--color-ink-tertiary]" aria-hidden="true" />
              <span className="text-[--text-body-sm] text-[--color-ink-secondary]">
                Số lượng còn lại:
              </span>
              <span className={[
                'text-[--text-body-sm] font-bold',
                isStoreClosed || isSoldOut ? 'text-[--color-ink-tertiary]'
                  : isLowStock ? 'text-red-600' : 'text-[--color-brand-700]',
              ].join(' ')}>
                {isStoreClosed ? 'Tạm đóng cửa' : isSoldOut ? 'Đã hết hàng' : `${listing!.quantityAvailable} phần`}
              </span>
            </div>

            {/* Cảnh báo sắp hết hàng */}
            {isLowStock && (
              <div className="flex items-center gap-2 p-3 rounded-[--radius-button]
                                bg-red-50 border border-red-200 text-red-700">
                <AlertTriangle size={15} strokeWidth={2.5} aria-hidden="true" />
                <span className="text-[--text-body-sm] font-medium">
                  Sắp hết! Chỉ còn {listing!.quantityAvailable} phần cuối cùng.
                </span>
              </div>
            )}

            {/* Surprise Bag description */}
            {listing!.isSurpriseBag && (
              <div className="p-4 rounded-[--radius-card] bg-amber-50 border border-amber-200">
                <p className="text-[--text-body-sm] font-semibold text-amber-800 mb-1">
                  🎁 Về Túi Bất Ngờ
                </p>
                <p className="text-[--text-body-sm] text-amber-700 leading-relaxed">
                  Đây là sản phẩm dạng "hộp mù" — nội dung thực tế sẽ là bất ngờ! Tổng giá trị
                  các sản phẩm bên trong cam kết tối thiểu{' '}
                  <strong>{formatVND(listing!.originalPrice)}</strong>, nhưng bạn chỉ trả{' '}
                  <strong>{formatVND(listing!.salePrice)}</strong>.
                </p>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex gap-3 mt-2">
              {isMyStore ? (
                <div className="w-full py-4 text-center rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-100">
                  Đây là sản phẩm thuộc cửa hàng của bạn
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onActionClick('add_to_cart')}
                    disabled={isSoldOut || isStoreClosed || addToCartMutation.isPending}
                    className="flex items-center justify-center gap-2 flex-1 py-3.5 rounded-full
                                 text-[--text-body-md] font-bold transition-all duration-300
                                 bg-brand-100 text-brand-700 border border-brand-200 hover:bg-brand-200
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-disabled={isSoldOut || isStoreClosed || addToCartMutation.isPending}
                  >
                    <ShoppingCart size={18} strokeWidth={2.5} aria-hidden="true" />
                    {isStoreClosed ? 'Tạm đóng cửa' : isSoldOut ? 'Hết hàng' : 'Thêm vào giỏ'}
                  </button>

                  <button
                    onClick={() => onActionClick('buy_now')}
                    disabled={isSoldOut || isStoreClosed || addToCartMutation.isPending}
                    className="flex items-center justify-center gap-2 flex-1 py-3.5 rounded-full
                                 text-[--text-body-md] font-bold transition-all duration-300
                                 bg-brand-500 text-white hover:bg-brand-600
                                 hover:shadow-[0_8px_30px_rgba(34,197,94,0.3)]
                                 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
                    aria-disabled={isSoldOut || isStoreClosed || addToCartMutation.isPending}
                  >
                    {isStoreClosed ? 'Tạm đóng cửa' : isSoldOut ? 'Hết hàng' : 'Mua ngay'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Related Listings ── */}
        {relatedListings.length > 0 && (
          <section aria-labelledby="related-heading">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-2 sm:gap-0">
              <h2
                id="related-heading"
                className="text-[--text-heading-sm] font-bold text-[--color-ink-primary] pr-2"
              >
                Sản phẩm khác từ {listing!.storeName}
              </h2>
              <Link
                to={`/stores/${listing!.storeId}`}
                className="text-[--text-body-sm] font-semibold text-[--color-brand-600] hover:underline"
              >
                Xem tất cả →
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {relatedListings.map(l => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Distance Warning Modal */}
      {showDistanceModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-[--animate-fade-in]">
            <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-4">
              <MapPin width={24} height={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Khoảng cách xa (&gt; 5km)
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Quán này cách vị trí hiện tại của bạn khá xa. Hãy đảm bảo bạn có thể sắp xếp thời gian đến lấy hàng đúng giờ để tránh rủi ro bị hủy đơn (không hoàn tiền). Bạn có chắc chắn muốn tiếp tục không?
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowDistanceModal({ isOpen: false })}
                className="flex-1 py-2.5 font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  if (showDistanceModal.action === 'add_to_cart') handleAddToCart();
                  else if (showDistanceModal.action === 'buy_now') handleBuyNow();
                  setShowDistanceModal({ isOpen: false });
                }}
                className="flex-1 py-2.5 font-bold text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
