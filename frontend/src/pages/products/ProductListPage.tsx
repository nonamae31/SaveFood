// ─── ProductListPage ─────────────────────────────────────────────────────────
// Route: /products
// Trang duyệt Clearance Listings cho Customer (Người 3).

import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Sparkles, RefreshCw } from 'lucide-react'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ListingCard } from '@/components/listings/ListingCard'
import { ListingFilters } from '@/components/listings/ListingFilters'
import { useListings, useRecommendations } from '@/hooks/useListings'
import { useAuthContext } from '@/contexts/AuthContext'
import { useLocationContext } from '@/contexts/LocationContext'
import type { ListingFilter } from '@/types/listing.types'

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuthContext()
  const { location: userLocation } = useLocationContext()

  const filter: ListingFilter = useMemo(() => {
    return {
      categoryIds: searchParams.getAll('categoryIds').length > 0 ? searchParams.getAll('categoryIds') : undefined,
      minPrice: searchParams.has('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.has('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      isSurpriseBag: searchParams.has('isSurpriseBag') ? searchParams.get('isSurpriseBag') === 'true' : undefined,
      sortBy: (searchParams.get('sortBy') as ListingFilter['sortBy']) || undefined,
      searchQuery: searchParams.get('q') || undefined,
      radiusKm: searchParams.has('radiusKm') ? Number(searchParams.get('radiusKm')) : undefined,
      userLat: userLocation?.lat,
      userLng: userLocation?.lng,
    }
  }, [searchParams, userLocation])

  const setFilter = (next: ListingFilter) => {
    const params = new URLSearchParams()
    if (next.categoryIds?.length) next.categoryIds.forEach(id => params.append('categoryIds', id))
    if (next.minPrice !== undefined) params.set('minPrice', String(next.minPrice))
    if (next.maxPrice !== undefined) params.set('maxPrice', String(next.maxPrice))
    if (next.isSurpriseBag !== undefined) params.set('isSurpriseBag', String(next.isSurpriseBag))
    if (next.sortBy) params.set('sortBy', next.sortBy)
    if (next.searchQuery) params.set('q', next.searchQuery)
    if (next.radiusKm !== undefined) params.set('radiusKm', String(next.radiusKm))
    setSearchParams(params)
  }

  const {
    data: listings,
    isLoading,
    isError,
    error,
    refetch,
  } = useListings(filter)

  const {
    data: recommendations,
    isLoading: isRecsLoading,
  } = useRecommendations()

  const showRecs = isAuthenticated && !isRecsLoading && recommendations && recommendations.length > 0

  return (
    <>
      {/* ── Hero Banner ── */}
      <section className="relative bg-gradient-to-br from-[#0f2913] to-[#1a3d20] text-white overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #8ced7f 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

        <div className="relative max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-14 sm:pt-36 sm:pb-16">

          <h1 className="text-4xl sm:text-5xl font-bold font-[--font-display] leading-tight mb-3">
            {filter.searchQuery ? (
              <>Kết quả tìm kiếm cho: <span className="text-[#8ced7f] font-serif italic font-normal">"{filter.searchQuery}"</span></>
            ) : (
              <>Đồ ăn <span className="text-[#8ced7f] font-serif italic font-normal">cận date</span></>
            )}
          </h1>
          <p className="text-white/70 max-w-xl text-base sm:text-lg leading-relaxed">
            {filter.searchQuery ? (
              <>Khám phá các sản phẩm phù hợp với từ khóa tìm kiếm của bạn.</>
            ) : (
              <>Tiết kiệm đến <strong className="text-[#8ced7f]">70%</strong> cho thực phẩm sắp hết hạn từ các cửa hàng uy tín — vừa tiết kiệm, vừa bảo vệ môi trường.</>
            )}
          </p>
        </div>
      </section>

      <div className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Gợi ý cá nhân hóa (chỉ hiển thị khi đã login và có data) ── */}
        {showRecs && (
          <section aria-labelledby="recommendations-heading">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-[--color-brand-600]" aria-hidden="true" />
              <h2
                id="recommendations-heading"
                className="text-[--text-heading-sm] font-bold text-[--color-ink-primary]"
              >
                Gợi ý cho bạn
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.slice(0, 4).map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* ── Filter Bar ── */}
        <ListingFilters
          filter={filter}
          onChange={setFilter}
          totalCount={listings?.length}
        />

        {/* ── Lưới sản phẩm ── */}
        <section aria-labelledby="listings-heading">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="listings-heading"
              className="text-[--text-heading-sm] font-bold text-[--color-ink-primary]"
            >
              Tất cả sản phẩm
            </h2>
            {!isLoading && !isError && (
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1.5 text-[--text-body-sm] text-[--color-ink-secondary]
                           hover:text-[--color-ink-primary] transition-colors"
                aria-label="Làm mới danh sách"
              >
                <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
                Làm mới
              </button>
            )}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <SkeletonCard count={9} />
            </div>
          )}

          {/* Error */}
          {isError && !isLoading && (
            <ErrorState
              error={error}
              title="Không thể tải danh sách"
              onRetry={() => refetch()}
            />
          )}

          {/* Empty */}
          {!isLoading && !isError && listings && listings.length === 0 && (
            <EmptyState
              title="Không tìm thấy sản phẩm"
              description="Không có sản phẩm nào phù hợp với bộ lọc hiện tại. Hãy thử điều chỉnh tiêu chí lọc."
              action={
                <button
                  onClick={() => setFilter({})}
                  className="px-5 py-2.5 rounded-full bg-[--color-brand-500] text-white
                             text-sm font-bold hover:bg-[--color-brand-600] transition-all duration-300"
                >
                  Xóa bộ lọc
                </button>
              }
            />
          )}

          {/* Data */}
          {!isLoading && !isError && listings && listings.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
