import { useState } from 'react'
import { Filter } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ListingFilters } from './ListingFilters'
import type { ListingFilter } from '@/types/listing.types'

interface FilterBottomSheetProps {
  filter: ListingFilter
  onChange: (next: ListingFilter) => void
  totalCount?: number
}

export function FilterBottomSheet({ filter, onChange, totalCount }: FilterBottomSheetProps) {
  const [isOpen, setIsOpen] = useState(false)

  // This wrapper will render a "Filter" button on mobile, 
  // and the standard ListingFilters on desktop.
  // Actually, wait, ListingFilters is already responsive? 
  // We'll render just the trigger button on mobile, and hide the inline ListingFilters.
  // But wait, the standard approach is to render the ListingFilters inside the BottomSheet for mobile.

  return (
    <>
      {/* Mobile Trigger Button */}
      <div className="sm:hidden mb-4">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-[--color-ink-primary] font-bold"
        >
          <Filter size={18} />
          Bộ lọc & Sắp xếp {totalCount !== undefined && `(${totalCount})`}
        </button>
      </div>

      {/* Desktop view: ListingFilters inline */}
      <div className="hidden sm:block">
        <ListingFilters filter={filter} onChange={onChange} totalCount={totalCount} />
      </div>

      {/* Mobile view: ListingFilters inside BottomSheet */}
      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Bộ lọc & Sắp xếp">
        {/* We add a wrapper to reset padding if needed, or just render it */}
        <div className="pb-6">
          <ListingFilters 
            filter={filter} 
            onChange={(newFilter) => {
              onChange(newFilter)
              // Optionally close on change, or let the user click "Apply" if we add an apply button.
              // For now we don't auto-close so they can change multiple filters.
            }} 
            totalCount={totalCount} 
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="w-full mt-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold transition-colors shadow-sm"
          >
            Áp dụng
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
