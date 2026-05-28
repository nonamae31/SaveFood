// ─── ListingCard Component ───────────────────────────────────────────────────
// Hiển thị 1 Clearance Listing dưới dạng thẻ sản phẩm.
// Dùng trong ProductListPage (lưới) và trang gợi ý.

import { Link } from 'react-router-dom'
import { ShoppingBag, Package, Store, Hash } from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { formatVND, calcDiscountPercent } from '@/lib/formatters'
import { ExpiryLabel } from '@/components/ui/ExpiryLabel'
import { DiscountTag } from '@/components/ui/DiscountTag'
import type { CustomerListingDTO } from '@/types/listing.types'

interface ListingCardProps {
  listing: CustomerListingDTO
}

export function ListingCard({ listing }: ListingCardProps) {
  const discount = calcDiscountPercent(listing.originalPrice, listing.salePrice)
  const isLowStock = listing.quantityAvailable <= 3 && listing.quantityAvailable > 0
  const isSoldOut  = listing.quantityAvailable === 0

  return (
    <Link
      to={ROUTES.PRODUCT_DETAIL(listing.id)}
      id={`listing-card-${listing.id}`}
      className="group block rounded-[--radius-card] bg-[--color-surface-base] shadow-[--shadow-card]
                 hover:shadow-[--shadow-card-hover] transition-all duration-200 overflow-hidden
                 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[--color-brand-500]"
      aria-label={`${listing.title} — ${formatVND(listing.salePrice)}`}
    >
      {/* ── Ảnh / Placeholder ── */}
      <div className="relative h-44 bg-gradient-to-br from-[--color-brand-50] to-[--color-brand-100] flex items-center justify-center overflow-hidden">
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
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[--radius-badge]
                             bg-amber-400 text-white text-[--text-caption] font-bold">
              🎁 Surprise
            </span>
          </div>
        )}

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-[--text-body-sm] font-bold text-[--color-ink-tertiary] bg-white px-3 py-1 rounded-[--radius-badge] shadow">
              Đã hết hàng
            </span>
          </div>
        )}
      </div>

      {/* ── Thông tin sản phẩm ── */}
      <div className="p-[--spacing-card-p] flex flex-col gap-2">
        {/* Tên */}
        <h3 className="text-[--text-body-md] font-semibold text-[--color-ink-primary] leading-snug
                       group-hover:text-[--color-brand-700] transition-colors line-clamp-2">
          {listing.title}
        </h3>

        {/* Cửa hàng */}
        <div className="flex items-center gap-1 text-[--text-body-sm] text-[--color-ink-secondary]">
          <Store size={13} strokeWidth={2} aria-hidden="true" />
          <span className="truncate">{listing.storeName}</span>
        </div>

        {/* Expiry label */}
        <ExpiryLabel expiresAt={listing.expiryDate} size="sm" />

        {/* Giá */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-[--text-heading-sm] font-bold text-[--color-brand-700]">
            {formatVND(listing.salePrice)}
          </span>
          {discount > 0 && (
            <span className="text-[--text-body-sm] text-[--color-ink-tertiary] line-through">
              {formatVND(listing.originalPrice)}
            </span>
          )}
        </div>

        {/* Số lượng còn lại */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <Hash size={12} strokeWidth={2.5} className="text-[--color-ink-tertiary]" aria-hidden="true" />
            <span className={[
              'text-[--text-caption] font-medium',
              isLowStock ? 'text-red-500' : 'text-[--color-ink-tertiary]',
            ].join(' ')}>
              {isSoldOut
                ? 'Hết hàng'
                : isLowStock
                  ? `Còn ${listing.quantityAvailable} phần`
                  : `${listing.quantityAvailable} phần`}
            </span>
          </div>

          {/* Nút xem nhanh */}
          <span
            className="text-[--text-caption] font-semibold text-[--color-brand-600]
                       group-hover:underline transition-colors"
          >
            Xem chi tiết →
          </span>
        </div>
      </div>
    </Link>
  )
}
