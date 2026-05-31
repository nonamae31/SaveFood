import { Link } from 'react-router-dom'
import { MapPin, Star, Store, ArrowRight } from 'lucide-react'

import { useStores } from '@/hooks/useStores'
import { useLocationContext } from '@/contexts/LocationContext'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'

export function StoreListPage() {
  const { location: userLocation } = useLocationContext()
  const filter = {
    userLat: userLocation?.lat,
    userLng: userLocation?.lng,
    // radiusKm could be read from searchParams if needed, keeping it simple for now
  }
  const { data: stores, isLoading, isError, error, refetch } = useStores(filter)
  return (
    <>
      {/* ── Hero Banner ── */}
      <section className="relative bg-gradient-to-br from-[#0f2913] to-[#1a3d20] text-white overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #8ced7f 1px, transparent 1px)', backgroundSize: '32px 32px'}}></div>

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
        
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold font-[--font-display] text-[--color-ink-primary]">Tất cả cửa hàng</h2>
          
          <div className="flex items-center gap-2 bg-white border border-[--color-surface-border] rounded-full px-4 py-2 shadow-sm">
            <Store size={16} className="text-[--color-brand-500]" />
            <span className="text-sm font-medium text-[--color-ink-secondary]">Hiển thị tất cả</span>
          </div>
        </div>

        {/* Grid */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {!isLoading && !isError && stores && stores.length === 0 && (
          <EmptyState
            title="Chưa có cửa hàng đối tác"
            description="Hiện tại chưa có cửa hàng nào được duyệt tham gia hệ thống."
          />
        )}

        {!isLoading && !isError && stores && stores.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stores.map(store => (
              <Link 
                key={store.id} 
                to={`/stores/${store.id}`}
                className="relative bg-white rounded-[1.5rem] p-4 flex flex-col sm:flex-row gap-5 shadow-[--shadow-card] hover:shadow-[--shadow-card-hover] hover:-translate-y-1 transition-all duration-300 border border-[--color-surface-border] group overflow-hidden"
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
                <div className="w-full sm:w-32 h-40 sm:h-auto rounded-[1rem] overflow-hidden shrink-0 bg-gray-100 relative">
                  <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                
                {/* Content */}
                <div className="flex flex-col flex-1 py-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-[--color-brand-600] bg-[--color-brand-50] px-2 py-0.5 rounded-md">{store.category}</span>
                    <div className="flex items-center gap-1 bg-[#fff8e1] px-2 py-0.5 rounded-md text-[#f59e0b]">
                      <Star size={12} fill="currentColor" strokeWidth={2} />
                      <span className="text-xs font-bold">{store.rating != null ? `${store.rating} / 5` : '___'}</span>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg text-[--color-ink-primary] mb-1 group-hover:text-[--color-brand-600] transition-colors">{store.name}</h3>
                  
                  <div className="flex items-start gap-1.5 text-[--color-ink-secondary] text-sm mb-3">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
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
                  
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {store.distance !== undefined && store.distance !== null && (
                        <span className="text-sm text-brand-700 bg-brand-100 px-2.5 py-1 rounded-full font-bold shadow-sm">
                          {store.distance} km
                        </span>
                      )}
                      {store.tags.map(tag => (
                        <span key={tag} className="text-[11px] text-[--color-ink-tertiary] border border-[--color-surface-border] px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[--color-surface-muted] flex items-center justify-center group-hover:bg-[--color-brand-500] group-hover:text-white transition-colors shrink-0">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
