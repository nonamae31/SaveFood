// ─── ProductListPage ─────────────────────────────────────────────────────────
// Route: /products
// Trang duyệt Clearance Listings cho Customer (Người 3).

import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Sparkles, RefreshCw, Map as MapIcon, List as ListIcon, Loader2 } from 'lucide-react'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ListingCard } from '@/components/listings/ListingCard'
import { FilterBottomSheet } from '@/components/listings/FilterBottomSheet'
import { ListingMapView } from '@/components/listings/ListingMapView'
import { useListingsInfinite, useRecommendations } from '@/hooks/useListings'
import { useAuthContext } from '@/contexts/AuthContext'
import { useLocationContext } from '@/contexts/LocationContext'
import type { ListingFilter, CustomerListingDTO } from '@/types/listing.types'

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuthContext()
  const { location: userLocation } = useLocationContext()

  // View Toggle: 'list' or 'map'
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')

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
      pageSize: 20 // Số lượng tải mỗi lần cuộn
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
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useListingsInfinite(filter)

  const {
    data: recommendations,
    isLoading: isRecsLoading,
  } = useRecommendations(userLocation?.lat, userLocation?.lng)

  const showRecs = isAuthenticated && !isRecsLoading && recommendations && recommendations.length > 0

  useEffect(() => {
    setCurrentPage(1)
    
    // Auto-scroll to listings if a search query exists
    if (searchParams.has('q')) {
      const el = document.getElementById('listings-heading');
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 100; // Offset for header
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  }, [searchParams])

  const totalCount = data?.pages[0]?.totalCount

  return (
    <>
      {/* ── Hero Banner ── */}
      <section className="relative bg-gradient-to-br from-[#0f2913] to-[#1a3d20] text-white overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #8ced7f 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

        <div className="relative max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-14 sm:pt-36 sm:pb-16">
          <h1 className="text-4xl sm:text-5xl font-bold font-[--font-display] leading-tight mb-3">
            {filter.searchQuery ? (
              <>Kết quả tìm kiếm cho: <span className="text-[#8ced7f]">"{filter.searchQuery}"</span></>
            ) : (
              <>Đồ ăn <span className="text-[#8ced7f]">cận date</span></>
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {recommendations.slice(0, 4).map(listing => (
                <ListingCard key={`rec-${listing.id}`} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* ── Filter & View Toggle Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <FilterBottomSheet
              filter={filter}
              onChange={setFilter}
              totalCount={totalCount}
            />
          </div>
          
          {/* View Toggle */}
          <div className="hidden sm:flex items-center bg-gray-100 p-1 rounded-xl shrink-0 self-end">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ListIcon size={16} /> Danh sách
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'map' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <MapIcon size={16} /> Bản đồ
            </button>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <section aria-labelledby="listings-heading">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="listings-heading"
              className="text-[--text-heading-sm] font-bold text-[--color-ink-primary]"
            >
              {viewMode === 'map' ? 'Khám phá trên bản đồ' : 'Tất cả sản phẩm'}
              {totalCount !== undefined && <span className="text-gray-500 text-sm ml-2 font-normal">({totalCount} kết quả)</span>}
            </h2>
            {!isLoading && !isError && (
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1.5 text-[--text-body-sm] text-[--color-ink-secondary]
                           hover:text-[--color-ink-primary] transition-colors"
                aria-label="Làm mới"
              >
                <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
            )}
          </div>

          {/* Loading */}
          {isLoading && viewMode === 'list' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
              <SkeletonCard count={10} />
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
          {!isLoading && !isError && allListings.length === 0 && (
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
          {!isLoading && !isError && allListings.length > 0 && (
            <>
              {viewMode === 'list' ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
                    {allListings.map(listing => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>

                  {/* Infinite Scroll Load More Button */}
                  {hasNextPage && (
                    <div className="flex justify-center mt-10">
                      <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="px-8 py-3 rounded-full border-2 border-brand-500 text-brand-600 font-bold hover:bg-brand-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isFetchingNextPage ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Đang tải...
                          </>
                        ) : (
                          'Xem thêm sản phẩm'
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-[60vh] min-h-[500px]">
                  <ListingMapView listings={allListings} />
                  
                  {/* Option to load more on map if there are more pages */}
                  {hasNextPage && (
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="px-6 py-2 rounded-full bg-white border border-gray-300 shadow-sm text-sm font-bold hover:bg-gray-50 flex items-center gap-2"
                      >
                        {isFetchingNextPage ? <Loader2 size={16} className="animate-spin" /> : 'Tải thêm vị trí'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  )
}
