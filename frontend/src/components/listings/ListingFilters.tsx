// ─── ListingFilters Component ────────────────────────────────────────────────
// Filter bar cho trang danh sách Clearance Listings.
// Dùng controlled state — parent giữ `filter`, component này emit onChange.

import { SlidersHorizontal, X } from 'lucide-react'
import type { ListingFilter } from '@/types/listing.types'

interface ListingFiltersProps {
  filter: ListingFilter
  onChange: (next: ListingFilter) => void
  totalCount?: number
}

const SORT_OPTIONS: { label: string; value: ListingFilter['sortBy'] }[] = [
  { label: 'Sắp hết hạn', value: 'expiry_asc' },
  { label: 'Giá thấp nhất', value: 'price_asc'  },
  { label: 'Giá cao nhất', value: 'price_desc' },
]

export function ListingFilters({ filter, onChange, totalCount }: ListingFiltersProps) {
  const hasActiveFilters =
    filter.minPrice !== undefined ||
    filter.maxPrice !== undefined ||
    filter.isSurpriseBag !== undefined ||
    filter.sortBy !== undefined

  function reset() {
    onChange({})
  }

  return (
    <div
      className="bg-[--color-surface-base] border border-[--color-surface-border] rounded-[--radius-card]
                 p-4 flex flex-wrap items-center gap-3"
      role="search"
      aria-label="Bộ lọc sản phẩm"
    >
      {/* Icon */}
      <div className="flex items-center gap-2 text-[--color-ink-secondary]">
        <SlidersHorizontal size={16} strokeWidth={2} aria-hidden="true" />
        <span className="text-[--text-body-sm] font-semibold text-[--color-ink-primary] hidden sm:inline">
          Lọc
        </span>
      </div>

      <div className="h-5 w-px bg-[--color-surface-border] hidden sm:block" aria-hidden="true" />

      {/* ── Sắp xếp ── */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="filter-sort"
          className="text-[--text-body-sm] text-[--color-ink-secondary] whitespace-nowrap"
        >
          Sắp xếp:
        </label>
        <select
          id="filter-sort"
          value={filter.sortBy ?? ''}
          onChange={e => onChange({ ...filter, sortBy: (e.target.value as ListingFilter['sortBy']) || undefined })}
          className="text-[--text-body-sm] rounded-[--radius-input] border border-[--color-surface-border]
                     bg-[--color-surface-subtle] px-2.5 py-1.5 focus:outline-none
                     focus:ring-2 focus:ring-[--color-brand-500] cursor-pointer"
        >
          <option value="">Mặc định</option>
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Khoảng giá ── */}
      <div className="flex items-center gap-2">
        <label className="text-[--text-body-sm] text-[--color-ink-secondary] whitespace-nowrap">
          Giá:
        </label>
        <input
          id="filter-min-price"
          type="number"
          min={0}
          placeholder="Từ"
          value={filter.minPrice ?? ''}
          onChange={e => onChange({ ...filter, minPrice: e.target.value ? Number(e.target.value) : undefined })}
          className="w-24 text-[--text-body-sm] rounded-[--radius-input] border border-[--color-surface-border]
                     bg-[--color-surface-subtle] px-2.5 py-1.5 focus:outline-none
                     focus:ring-2 focus:ring-[--color-brand-500]"
          aria-label="Giá tối thiểu"
        />
        <span className="text-[--color-ink-tertiary] text-[--text-body-sm]">–</span>
        <input
          id="filter-max-price"
          type="number"
          min={0}
          placeholder="Đến"
          value={filter.maxPrice ?? ''}
          onChange={e => onChange({ ...filter, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
          className="w-24 text-[--text-body-sm] rounded-[--radius-input] border border-[--color-surface-border]
                     bg-[--color-surface-subtle] px-2.5 py-1.5 focus:outline-none
                     focus:ring-2 focus:ring-[--color-brand-500]"
          aria-label="Giá tối đa"
        />
      </div>

      {/* ── Surprise Bag toggle ── */}
      <label
        className="flex items-center gap-2 cursor-pointer select-none"
        htmlFor="filter-surprise"
      >
        <input
          id="filter-surprise"
          type="checkbox"
          checked={filter.isSurpriseBag === true}
          onChange={e => onChange({ ...filter, isSurpriseBag: e.target.checked ? true : undefined })}
          className="w-4 h-4 rounded accent-[--color-brand-500] cursor-pointer"
        />
        <span className="text-[--text-body-sm] text-[--color-ink-secondary] whitespace-nowrap">
          🎁 Túi Bất Ngờ
        </span>
      </label>

      {/* ── Spacer + tổng kết quả + reset ── */}
      <div className="flex items-center gap-3 ml-auto">
        {totalCount !== undefined && (
          <span className="text-[--text-body-sm] text-[--color-ink-tertiary]">
            {totalCount} kết quả
          </span>
        )}
        {hasActiveFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-[--text-body-sm] font-medium text-red-500
                       hover:text-red-700 transition-colors"
            aria-label="Xóa tất cả bộ lọc"
          >
            <X size={14} strokeWidth={2.5} aria-hidden="true" />
            Xóa lọc
          </button>
        )}
      </div>
    </div>
  )
}
