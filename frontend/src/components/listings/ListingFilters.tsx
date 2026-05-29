// ─── ListingFilters Component ────────────────────────────────────────────────
// Filter bar cho trang danh sách Clearance Listings.

import { useState, useRef, useEffect } from 'react'
import { SlidersHorizontal, X, ChevronDown, SortDesc, PackageSearch, Tag } from 'lucide-react'
import type { ListingFilter } from '@/types/listing.types'
import { useCategories } from '@/api/category.api'

interface ListingFiltersProps {
  filter: ListingFilter
  onChange: (next: ListingFilter) => void
  totalCount?: number
}

const SORT_OPTIONS = [
  { label: 'Mặc định', value: '' },
  { label: 'Sắp hết hạn', value: 'expiry_asc' },
  { label: 'Giá thấp nhất', value: 'price_asc' },
  { label: 'Giá cao nhất', value: 'price_desc' },
]

const TYPE_OPTIONS = [
  { label: 'Tất cả loại', value: '' },
  { label: 'Túi bất ngờ', value: 'surprise' },
  { label: 'Món lẻ', value: 'normal' },
]

function CustomSelect({
  options, value, onChange, icon: Icon, className = ""
}: {
  options: { label: string, value: string }[],
  value: string,
  onChange: (val: string) => void,
  icon?: any,
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o.value === value) || options[0]

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full gap-2 px-4 py-2 rounded-full hover:bg-gray-50 text-sm font-bold text-[--color-ink-secondary] hover:text-[--color-brand-600] transition-colors whitespace-nowrap"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className={value ? "text-[--color-brand-500]" : "text-gray-400"} />}
          {selectedOption.label}
        </div>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 shadow-[--shadow-card] rounded-2xl py-2 z-50 animate-[fadeIn_0.2s_ease-out]">
          {options.map(opt => (
            <button
              key={opt.value}
              className={`w-full text-left px-5 py-2.5 text-sm transition-colors ${value === opt.value
                ? 'bg-[--color-brand-50] text-[--color-brand-600] font-bold'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }`}
              onClick={() => {
                onChange(opt.value)
                setIsOpen(false)
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ListingFilters({ filter, onChange, totalCount }: ListingFiltersProps) {
  const { data: categories } = useCategories()
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  
  // Local state for filters
  const [localFilter, setLocalFilter] = useState<ListingFilter>(filter)

  // Sync local state when external filter changes (e.g. reset from parent)
  useEffect(() => {
    setLocalFilter(filter)
  }, [filter])

  const selectedCategoryIds = localFilter.categoryIds || []

  function toggleCategory(id: string) {
    let nextIds = [...selectedCategoryIds]
    if (nextIds.includes(id)) {
      nextIds = nextIds.filter(x => x !== id)
    } else {
      nextIds.push(id)
    }
    setLocalFilter({ ...localFilter, categoryIds: nextIds.length > 0 ? nextIds : undefined })
  }

  const hasActiveFilters =
    (filter.categoryIds && filter.categoryIds.length > 0) ||
    filter.minPrice !== undefined ||
    filter.maxPrice !== undefined ||
    filter.isSurpriseBag !== undefined ||
    filter.sortBy !== undefined

  // Compare localFilter with props.filter
  const hasChanges = JSON.stringify(localFilter) !== JSON.stringify(filter)
  const isClearMode = hasActiveFilters && !hasChanges

  function handleAction() {
    if (isClearMode) {
      setLocalFilter({})
      onChange({})
    } else {
      onChange(localFilter)
    }
  }

  // Dual Range Slider logic
  const MIN_PRICE = 0
  const MAX_PRICE = 500000
  const STEP = 10000

  const currentMin = localFilter.minPrice ?? MIN_PRICE
  const currentMax = localFilter.maxPrice ?? MAX_PRICE

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), currentMax - STEP)
    setLocalFilter({ ...localFilter, minPrice: val === MIN_PRICE ? undefined : val })
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), currentMin + STEP)
    setLocalFilter({ ...localFilter, maxPrice: val >= MAX_PRICE ? undefined : val })
  }

  const formatPrice = (p: number) => p >= MAX_PRICE ? 'Mọi mức' : `${p.toLocaleString()}đ`

  // Type selection logic
  const typeValue = localFilter.isSurpriseBag === true ? 'surprise' : localFilter.isSurpriseBag === false ? 'normal' : ''
  const handleTypeChange = (val: string) => {
    setLocalFilter({
      ...localFilter,
      isSurpriseBag: val === 'surprise' ? true : val === 'normal' ? false : undefined
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="bg-white border border-gray-100 shadow-[--shadow-card] rounded-[1.5rem] sm:rounded-full p-3 flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full transition-all duration-300 hover:shadow-[--shadow-card-hover]"
        role="search"
        aria-label="Bộ lọc sản phẩm"
      >
      {/* Icon (removed text as requested) */}
      <div className="w-10 h-10 rounded-full bg-[--color-brand-50] flex items-center justify-center shrink-0 ml-1">
        <SlidersHorizontal size={18} className="text-[--color-brand-600]" strokeWidth={2.5} aria-hidden="true" />
      </div>

      <div className="h-6 w-px bg-gray-200 hidden sm:block mx-1" aria-hidden="true" />

      {/* ── Custom Selects ── */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
        <CustomSelect
          options={SORT_OPTIONS}
          value={localFilter.sortBy ?? ''}
          onChange={val => setLocalFilter({ ...localFilter, sortBy: (val as ListingFilter['sortBy']) || undefined })}
          icon={SortDesc}
          className="w-[150px]"
        />
        <CustomSelect
          options={TYPE_OPTIONS}
          value={typeValue}
          onChange={handleTypeChange}
          className="w-[130px]"
        />
        <button
          onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            isCategoriesOpen || selectedCategoryIds.length > 0
              ? 'bg-[--color-brand-50] text-[--color-brand-600]'
              : 'hover:bg-gray-50 text-[--color-ink-secondary] hover:text-[--color-brand-600]'
          }`}
        >
          <Tag size={16} className={isCategoriesOpen || selectedCategoryIds.length > 0 ? 'text-[--color-brand-500]' : 'text-gray-400'} />
          <span className="whitespace-nowrap">Danh mục {selectedCategoryIds.length > 0 && `(${selectedCategoryIds.length})`}</span>
          <ChevronDown size={14} className={`transition-transform duration-300 ${isCategoriesOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="h-6 w-px bg-gray-200 hidden sm:block mx-2" aria-hidden="true" />

      {/* ── Thanh trượt khoảng giá (Dual Range) ── */}
      <div className="flex items-center gap-4 flex-1 min-w-[250px] w-full px-4 sm:px-2 pt-4 sm:pt-0 pb-2 sm:pb-0">
        <div className="text-xs font-bold text-[--color-ink-secondary] whitespace-nowrap hidden md:block">
          Khoảng giá:
        </div>

        <div className="flex-1 relative h-6 flex items-center group">
          {/* Background Track */}
          <div className="absolute w-full h-1.5 bg-gray-200 rounded-lg" />

          {/* Active Track */}
          <div
            className="absolute h-1.5 bg-[--color-brand-500] rounded-lg pointer-events-none"
            style={{
              left: `${((currentMin - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}%`,
              right: `${100 - ((currentMax - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}%`
            }}
          />

          {/* Min Thumb */}
          <input
            type="range"
            min={MIN_PRICE} max={MAX_PRICE} step={STEP}
            value={currentMin}
            onChange={handleMinChange}
            className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none z-20 
                       [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none 
                       [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[--color-brand-500] 
                       [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-125 transition-transform"
          />

          {/* Max Thumb */}
          <input
            type="range"
            min={MIN_PRICE} max={MAX_PRICE} step={STEP}
            value={currentMax}
            onChange={handleMaxChange}
            className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none z-30
                       [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none 
                       [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[--color-brand-500] 
                       [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-125 transition-transform"
          />

          {/* Tooltips visible always */}
          <div className="absolute -top-7 left-0 right-0 flex justify-between pointer-events-none transition-opacity duration-300">
            <span className="text-[10px] font-bold text-[--color-brand-700] bg-[--color-brand-50] px-1.5 py-0.5 rounded shadow-sm"
              style={{ position: 'absolute', left: `calc(${((currentMin - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}% - 12px)` }}>
              {formatPrice(currentMin)}
            </span>
            <span className="text-[10px] font-bold text-[--color-brand-700] bg-[--color-brand-50] px-1.5 py-0.5 rounded shadow-sm"
              style={{ position: 'absolute', right: `calc(${100 - ((currentMax - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}% - 12px)` }}>
              {formatPrice(currentMax)}
            </span>
          </div>
        </div>
      </div>

      <div className="h-6 w-px bg-gray-200 hidden sm:block mx-1" aria-hidden="true" />

      {/* ── Spacer + reset ── */}
      <div className="flex items-center gap-3 ml-auto w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-gray-100 pt-3 sm:pt-0 pr-2">
        {totalCount !== undefined && (
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            {totalCount} món
          </span>
        )}
        
        <button
          onClick={handleAction}
          className={`flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-full transition-all shrink-0 min-w-[110px] justify-center
                     ${isClearMode
                       ? 'text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600'
                       : 'text-white bg-[#22c55e] hover:bg-[#16a34a] shadow-md shadow-[#22c55e]/20 hover:shadow-[#22c55e]/30'}`}
          aria-label={isClearMode ? "Xóa lọc" : "Lọc"}
        >
          {isClearMode ? (
            <>
              <X size={14} strokeWidth={2.5} aria-hidden="true" />
              Xóa lọc
            </>
          ) : (
            <>
              <SlidersHorizontal size={14} strokeWidth={2.5} aria-hidden="true" />
              Lọc
            </>
          )}
        </button>
      </div>
    </div>

    {/* ── Bảng chọn danh mục (Pills) ── */}
      {isCategoriesOpen && categories && (
        <div className="bg-white border border-gray-100 shadow-[--shadow-card] rounded-3xl p-5 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[--text-body-lg] font-bold text-[--color-ink-primary]">Danh mục sản phẩm</h3>
            {selectedCategoryIds.length > 0 && (
              <button
                onClick={() => setLocalFilter({ ...localFilter, categoryIds: undefined })}
                className="text-xs font-bold text-[--color-ink-tertiary] hover:text-red-500 transition-colors"
              >
                Bỏ chọn tất cả
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {categories.map(c => {
              const isSelected = selectedCategoryIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCategory(c.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                    isSelected
                      ? 'bg-[#22c55e] text-white border-[#22c55e] shadow-md shadow-[#22c55e]/20'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#4ade80] hover:text-[#16a34a] hover:bg-[#f0fdf4]'
                  }`}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
