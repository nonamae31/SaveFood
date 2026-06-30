// ─── ListingCard Component ───────────────────────────────────────────────────
// Hiển thị 1 Clearance Listing dưới dạng thẻ sản phẩm.
// Dùng trong ProductListPage (lưới) và trang gợi ý.

import { Link } from 'react-router-dom'
import { ShoppingBag, Package, Store, ShoppingCart, ArrowRight } from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { formatVND, calcDiscountPercent } from '@/lib/formatters'
import { ExpiryLabel } from '@/components/ui/ExpiryLabel'
import { DiscountTag } from '@/components/ui/DiscountTag'
import type { CustomerListingDTO } from '@/types/listing.types'
import { useAddToCart } from '@/hooks/useCart'
import { toast } from 'react-hot-toast'
import { useAuthContext } from '@/contexts/AuthContext'

interface ListingCardProps {
  listing: CustomerListingDTO
}

export function ListingCard({ listing }: ListingCardProps) {
  const discount = calcDiscountPercent(listing.originalPrice, listing.salePrice)
  const isLowStock = listing.quantityAvailable <= 3 && listing.quantityAvailable > 0
  const isSoldOut  = listing.quantityAvailable === 0
  
  const { user } = useAuthContext()
  const isMyStore = user?.storeId === listing.storeId
  const isStoreClosed = listing.storeStatus !== 0
  
  const addToCartMutation = useAddToCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isSoldOut || isMyStore || isStoreClosed || addToCartMutation.isPending) return
    
    addToCartMutation.mutate({ listingId: listing.id, quantity: 1 }, {
      onSuccess: () => {
        toast.success('Đã thêm vào giỏ hàng')
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng')
      }
    })
  }

  return (
    <Link
      to={ROUTES.PRODUCT_DETAIL(listing.id)}
      id={`listing-card-${listing.id}`}
      className="group flex flex-col h-full rounded-[1.5rem] bg-white border border-gray-100 shadow-sm
                 hover:shadow-lg transition-all duration-300 overflow-hidden
                 hover:-translate-y-1 hover:border-green-100 hover:shadow-[0_8px_30px_rgba(34,197,94,0.12)] focus-visible:outline-2 focus-visible:outline-green-500"
      aria-label={`${listing.title} — ${formatVND(listing.salePrice)}`}
    >
      {/* ── Ảnh / Placeholder ── */}
      <div className="relative h-36 sm:h-48 bg-[--color-surface-muted] flex items-center justify-center overflow-hidden">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
        ) : listing.isSurpriseBag ? (
          <div className="flex flex-col items-center gap-2 text-[--color-brand-600]">
            <ShoppingBag size={48} strokeWidth={1.5} />
            <span className="text-[--text-body-sm] font-medium">Túi Bất Ngờ</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-[--color-brand-500]">
            <Package size={48} strokeWidth={1.5} />
            <span className="text-[--text-caption] text-[--color-ink-tertiary]">Sản phẩm cận date</span>
          </div>
        )}

        {/* Discount tag — góc trên trái */}
        {discount > 0 && (
          <div className="absolute top-2.5 left-2.5">
            <DiscountTag percent={discount} size="md" />
          </div>
        )}



        {/* Surprise Bag badge — góc trên phải */}
        {listing.isSurpriseBag && (
          <div className="absolute top-2.5 left-2.5 mt-8">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                             bg-amber-400 text-white text-[--text-caption] font-bold shadow-sm">
              🎁 Surprise
            </span>
          </div>
        )}

        {/* Nút thêm vào giỏ hàng nhanh */}
        {!isSoldOut && (
          <button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
            className="absolute top-2.5 right-2.5 z-10 w-10 h-10 rounded-full bg-white/95 text-brand-500 
                       flex items-center justify-center shadow-md backdrop-blur-sm
                       transition-all duration-300 hover:bg-brand-500 hover:text-white 
                       hover:scale-110 active:scale-95 disabled:opacity-50"
            title="Thêm vào giỏ hàng"
          >
            <ShoppingCart size={18} strokeWidth={2.5} />
          </button>
        )}

        {/* Featured Badge — góc dưới phải */}
        {listing.hasFeaturedBadge && (
          <div className="absolute bottom-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                             bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[--text-caption] font-bold shadow-sm">
              ✨ Nổi bật
            </span>
          </div>
        )}

        {/* Sold out overlay */}
        {(isSoldOut || isStoreClosed) && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <span className="text-[--text-body-sm] font-bold text-[--color-ink-tertiary] bg-white px-3 py-1 rounded-md shadow">
              {isStoreClosed ? 'Tạm đóng cửa' : 'Đã hết hàng'}
            </span>
          </div>
        )}
      </div>

      {/* ── Thông tin sản phẩm ── */}
      <div className="p-3 sm:p-5 flex flex-col gap-2.5 flex-1 bg-white">
        {/* Tên */}
        <h3 className="text-sm sm:text-[--text-body-md] font-semibold text-[--color-ink-primary] leading-snug
                       group-hover:text-[--color-brand-700] transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-[2.75rem]">
          {listing.title}
        </h3>

        {/* Cửa hàng */}
        <div className="flex items-center justify-between text-xs sm:text-[--text-body-sm] text-[--color-ink-secondary] gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
            <Store size={14} strokeWidth={2} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{listing.storeName}</span>
          </div>
          {listing.distance !== undefined && listing.distance !== null && (
            <span className="text-[10px] sm:text-sm font-bold text-brand-700 bg-brand-100 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-sm shrink-0">
              {listing.distance} km
            </span>
          )}
        </div>

        {/* Expiry label */}
        <ExpiryLabel expiresAt={listing.expiryDate} size="sm" className="w-full flex justify-center" />

        {/* Giá */}
        <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1 sm:mt-2">
          <span className="text-lg sm:text-xl font-extrabold text-[--color-brand-700]">
            {formatVND(listing.salePrice)}
          </span>
          {discount > 0 && (
            <span className="text-xs sm:text-sm font-medium text-[--color-ink-tertiary] line-through">
              {formatVND(listing.originalPrice)}
            </span>
          )}
        </div>

        {/* Số lượng còn lại */}
        <div className="flex items-center justify-between mt-auto pt-2 sm:pt-3">
          {isMyStore ? (
            <span className="w-full sm:w-auto text-center sm:text-left text-xs sm:text-sm font-bold px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-md sm:rounded-md bg-blue-50 text-blue-700">
              Cửa hàng của bạn
            </span>
          ) : (
            <span className={`w-full sm:w-auto text-center sm:text-left text-xs sm:text-sm font-bold px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-md sm:rounded-md ${
              isStoreClosed || isSoldOut ? 'bg-gray-100 text-gray-500' 
              : isLowStock ? 'bg-red-50 text-red-600' 
              : 'bg-green-50 text-green-700'
            }`}>
              {isStoreClosed ? 'Tạm đóng cửa' : isSoldOut ? 'Hết hàng' : isLowStock ? `Chỉ còn ${listing.quantityAvailable} phần` : `Còn ${listing.quantityAvailable} phần`}
            </span>
          )}

          {/* Nút xem nhanh */}
          <span
            className="hidden sm:flex text-sm font-bold text-[--color-brand-600] group-hover:text-[--color-brand-700] transition-all duration-300 items-center gap-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 shrink-0"
          >
            Xem chi tiết <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  )
}
