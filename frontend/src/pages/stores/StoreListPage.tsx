import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Star, ArrowRight, Search, ChevronLeft, ChevronRight } from 'lucide-react'

import { useStores } from '@/hooks/useStores'
import { useLocationContext } from '@/contexts/LocationContext'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Select } from '@/components/ui/Select'

export function StoreListPage() {
  const { location: userLocation } = useLocationContext()
  const filter = {
    userLat: userLocation?.lat,
    userLng: userLocation?.lng,
    // radiusKm could be read from searchParams if needed, keeping it simple for now
  }
  const { data: stores, isLoading, isError, error, refetch } = useStores(filter)

  const [searchQuery, setSearchQuery] = useState('')
  const [ratingFilter, setRatingFilter] = useState<number>(0)
  const [distanceFilter, setDistanceFilter] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 6

  const filteredStores = useMemo(() => {
    if (!stores) return []
    let result = stores

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase()
      result = result.filter(store =>
        store.name.toLowerCase().includes(lowerQuery) ||
        store.address.toLowerCase().includes(lowerQuery) ||
        store.category.toLowerCase().includes(lowerQuery)
      )
    }

    if (ratingFilter > 0) {
      result = result.filter(store => store.rating != null && Math.floor(store.rating) === ratingFilter)
    }

    if (distanceFilter > 0) {
      result = result.filter(store => store.distance != null && store.distance <= distanceFilter)
    }

    return result
  }, [stores, searchQuery, ratingFilter, distanceFilter])

  const totalPages = Math.ceil(filteredStores.length / ITEMS_PER_PAGE)
  const paginatedStores = filteredStores.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  return (
    <>
      {/* ── Hero Banner ── */}
      <section className="relative bg-gradient-to-br from-[#0f2913] to-[#1a3d20] text-white overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #8ced7f 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

        <div className="relative max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-14 sm:pt-36 sm:pb-20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-[3px] rounded-full bg-[#8ced7f]"></div>
            <span className="text-sm font-medium text-[#8ced7f]/80 uppercase tracking-wider">Đối tác</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-[--font-display] leading-tight mb-3">
            Cửa hàng <span className="text-[#8ced7f] font-[--font-display] italic font-normal">liên kết</span>
          </h1>
          <p className="text-white/70 max-w-xl text-base sm:text-lg leading-relaxed">
            Khám phá các cửa hàng xung quanh bạn đang chung tay giải cứu thức ăn và bảo vệ môi trường.
          </p>
        </div>
      </section>

      {/* ── Store List ── */}
      <div className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

        {/* Header and Filters */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold font-[--font-display] text-[--color-ink-primary]">Tất cả cửa hàng</h2>

          <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[--color-ink-tertiary]" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm cửa hàng, địa chỉ..."
                value={searchQuery}
                onChange={handleSearchChange}
                data-testid="store-search-input"
                className="w-full pl-11 pr-4 py-2.5 border border-[--color-surface-border] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d20] focus:border-[#1a3d20] transition-colors shadow-sm"
              />
            </div>

            {/* Rating Filter */}
            <div className="w-full sm:w-48 z-20">
              <Select
                value={ratingFilter}
                onChange={(val) => { setRatingFilter(Number(val)); setCurrentPage(1); }}
                options={[
                  { value: 0, label: 'Tất cả đánh giá' },
                  { value: 5, label: '5 Sao' },
                  { value: 4, label: '4 Sao' },
                  { value: 3, label: '3 Sao' },
                  { value: 2, label: '2 Sao' },
                  { value: 1, label: '1 Sao' },
                ]}
              />
            </div>

            {/* Distance Filter */}
            <div className="w-full sm:w-56 z-10">
              <Select
                value={distanceFilter}
                onChange={(val) => { setDistanceFilter(Number(val)); setCurrentPage(1); }}
                options={[
                  { value: 0, label: 'Khoảng cách: Tất cả' },
                  { value: 1, label: 'Dưới 1 km' },
                  { value: 3, label: 'Dưới 3 km' },
                  { value: 5, label: 'Dưới 5 km' },
                  { value: 10, label: 'Dưới 10 km' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            <SkeletonCard count={4} />
          </div>
        )}

        {isError && !isLoading && (
          <ErrorState
            error={error}
            title="Không thể tải danh sách cửa hàng"
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && filteredStores.length === 0 && (
          <EmptyState
            title={searchQuery ? "Không tìm thấy cửa hàng" : "Chưa có cửa hàng đối tác"}
            description={searchQuery ? "Thử thay đổi từ khóa tìm kiếm của bạn." : "Hiện tại chưa có cửa hàng nào được duyệt tham gia hệ thống."}
          />
        )}

        {!isLoading && !isError && paginatedStores.length > 0 && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {paginatedStores.map(store => (
                <Link
                  key={store.id}
                  to={`/stores/${store.id}`}
                  className="relative bg-white rounded-[1.5rem] p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-5 shadow-[--shadow-card] hover:shadow-[--shadow-card-hover] hover:-translate-y-1 transition-all duration-300 border border-[--color-surface-border] group overflow-hidden"
                >
                  {/* Featured Badge */}
                  {store.hasFeaturedBadge && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[--radius-badge]
                                      bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[--text-caption] font-bold shadow-sm">
                        ✨ Nổi bật
                      </span>
                    </div>
                  )}

                  {/* Image */}
                  <div className="w-full sm:w-32 h-24 sm:h-auto rounded-[1rem] overflow-hidden shrink-0 bg-gray-100 relative">
                    <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 py-1">
                    <div className="flex justify-between items-start mb-1 flex-col sm:flex-row gap-1 sm:gap-0">
                      <span className="text-[10px] sm:text-xs font-bold text-[--color-brand-600] bg-[--color-brand-50] px-1.5 sm:px-2 py-0.5 rounded-md">{store.category}</span>
                      <div className="flex items-center gap-1 bg-[#fff8e1] px-1.5 sm:px-2 py-0.5 rounded-md text-[#f59e0b]">
                        <Star size={12} fill="currentColor" strokeWidth={2} />
                        <span className="text-[10px] sm:text-xs font-bold">{store.rating != null ? `${store.rating} / 5` : '___'}</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-sm sm:text-lg text-[--color-ink-primary] mb-1 group-hover:text-[--color-brand-600] transition-colors line-clamp-2">{store.name}</h3>

                    <div className="flex items-start gap-1 sm:gap-1.5 text-[--color-ink-secondary] text-xs sm:text-sm mb-2 sm:mb-3">
                      <MapPin size={12} className="mt-0.5 shrink-0 hidden sm:block" />
                      {store.latitude && store.longitude ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`, '_blank');
                          }}
                          className="text-left line-clamp-2 hover:text-[--color-brand-600] transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
                          title="Mở bản đồ chỉ đường"
                        >
                          {store.address}
                        </button>
                      ) : (
                        <span className="line-clamp-2">{store.address}</span>
                      )}
                    </div>

                    <div className="mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {store.distance !== undefined && store.distance !== null && (
                          <span className="text-xs sm:text-sm text-brand-700 bg-brand-100 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold shadow-sm">
                            {store.distance} km
                          </span>
                        )}
                        {store.tags.map(tag => (
                          <span key={tag} className="text-[9px] sm:text-[11px] text-[--color-ink-tertiary] border border-[--color-surface-border] px-1.5 sm:px-2 py-0.5 rounded-full line-clamp-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="hidden sm:flex w-8 h-8 rounded-full bg-green-600 text-white items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shrink-0">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pt-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  data-testid="pagination-prev"
                  className="p-2 rounded-full border border-[--color-surface-border] hover:bg-[--color-brand-50] hover:text-[--color-brand-600] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        data-testid={`pagination-page-${page}`}
                        className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center transition-all ${currentPage === page
                            ? 'bg-green-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100'
                          }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="pagination-next"
                  className="p-2 rounded-full border border-[--color-surface-border] hover:bg-[--color-brand-50] hover:text-[--color-brand-600] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Trang sau"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
