import { useParams, Link } from 'react-router-dom'
import { MapPin, Star, Clock, Phone, ArrowLeft, Info } from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { ListingCard } from '@/components/listings/ListingCard'
import { useStoreDetail } from '@/hooks/useStores'
import { useListings } from '@/hooks/useListings'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'

export function StoreDetailPage() {
  const { id } = useParams()

  const { data: store, isLoading: isStoreLoading, isError: isStoreError } = useStoreDetail(id)
  
  const { 
    data: listings, 
    isLoading: isListingsLoading, 
    isError: isListingsError 
  } = useListings({ storeId: id })

  if (isStoreLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[--color-brand-500] border-t-transparent"></div>
      </div>
    )
  }

  if (isStoreError || !store) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4">
        <ErrorState title="Không tìm thấy cửa hàng" error={new Error("Cửa hàng không tồn tại hoặc đã ngừng hoạt động.")} />
        <div className="mt-8 flex justify-center">
          <Link to={ROUTES.STORES} className="bg-[--color-brand-500] text-white px-6 py-2 rounded-full font-bold">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20">
      {/* ── Cover Image ── */}
      <div className="h-80 sm:h-96 w-full relative">
        <img src={store.coverImage} alt={store.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        
        {/* Back button */}
        <div className="absolute top-24 left-4 sm:left-8">
          <Link to={ROUTES.STORES} className="flex items-center gap-2 text-white bg-black/20 hover:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full transition-all text-sm font-medium border border-white/20">
            <ArrowLeft size={16} /> Quay lại
          </Link>
        </div>

        {/* Store Info Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10 max-w-[--spacing-container] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#8ced7f] bg-[#8ced7f]/20 border border-[#8ced7f]/30 px-3 py-1 rounded-full mb-3 inline-block">
                {store.category}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-white font-[--font-display] mb-2">{store.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                <div className="flex items-center gap-1.5">
                  <Star size={16} className="text-[#f59e0b] fill-[#f59e0b]" />
                  <span className="font-bold text-white">{store.rating} / 5</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} />
                  <span>{store.address}</span>
                </div>
              </div>
            </div>
            
            <button className="bg-[#8ced7f] text-[#0f2913] hover:bg-[#7bde6c] font-bold px-6 py-2.5 rounded-full transition-all shadow-sm">
              Theo dõi cửa hàng
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* ── Main Content (Listings) ── */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-[3px] rounded-full bg-[--color-brand-500]"></div>
              <h2 className="text-2xl font-bold font-[--font-display] text-[--color-ink-primary]">Sản phẩm hôm nay</h2>
            </div>
          </div>
          
          {/* Listings State */}
          {isListingsLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <SkeletonCard count={4} />
            </div>
          )}

          {isListingsError && !isListingsLoading && (
            <ErrorState title="Không thể tải sản phẩm" error={new Error("Đã có lỗi xảy ra khi tải danh sách sản phẩm.")} />
          )}

          {!isListingsLoading && !isListingsError && listings && listings.length === 0 && (
            <EmptyState 
              title="Chưa có sản phẩm nào" 
              description="Cửa hàng này hiện chưa có sản phẩm cận date nào đang bán." 
              icon={Info}
            />
          )}

          {!isListingsLoading && !isListingsError && listings && listings.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {listings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar (Info) ── */}
        <div className="lg:col-span-1">
          <div className="bg-[--color-surface-base] border border-[--color-surface-border] rounded-[1.5rem] p-6 shadow-[--shadow-card] sticky top-24">
            <h3 className="font-bold text-lg mb-4">Thông tin cửa hàng</h3>
            <p className="text-[--color-ink-secondary] text-sm leading-relaxed mb-6">
              {store.description}
            </p>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="text-[--color-brand-500] shrink-0 mt-0.5" size={18} />
                <span className="text-sm text-[--color-ink-secondary]">{store.address}</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="text-[--color-brand-500] shrink-0 mt-0.5" size={18} />
                <span className="text-sm text-[--color-ink-secondary]">Mở cửa: {store.openingHours}</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="text-[--color-brand-500] shrink-0 mt-0.5" size={18} />
                <span className="text-sm text-[--color-ink-secondary]">{store.phone}</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
