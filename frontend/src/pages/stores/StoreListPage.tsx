import { Link } from 'react-router-dom'
import { MapPin, Star, Store, ArrowRight } from 'lucide-react'
import { ROUTES } from '@/lib/constants'

// Mock Data
const MOCK_STORES = [
  {
    id: 'store-1',
    name: 'Highlands Coffee - Vincom Center',
    category: 'Cà phê & Bánh ngọt',
    rating: 4.8,
    reviews: 124,
    distance: '0.5 km',
    address: '72 Lê Thánh Tôn, Quận 1, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80',
    tags: ['Cà phê', 'Bánh ngọt', 'Ăn sáng']
  },
  {
    id: 'store-2',
    name: 'Paris Baguette - Cao Thắng',
    category: 'Tiệm bánh',
    rating: 4.6,
    reviews: 89,
    distance: '1.2 km',
    address: '1 Cao Thắng, Quận 3, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80',
    tags: ['Bánh mì', 'Bánh kem']
  },
  {
    id: 'store-3',
    name: 'Circle K - Nguyễn Đình Chiểu',
    category: 'Cửa hàng tiện lợi',
    rating: 4.3,
    reviews: 45,
    distance: '0.8 km',
    address: '123 Nguyễn Đình Chiểu, Quận 3, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1567364653606-218a595a4bd0?auto=format&fit=crop&q=80',
    tags: ['Đồ ăn nhanh', 'Nước uống']
  },
  {
    id: 'store-4',
    name: 'Gà rán KFC - Lê Văn Sỹ',
    category: 'Thức ăn nhanh',
    rating: 4.5,
    reviews: 210,
    distance: '2.1 km',
    address: '400 Lê Văn Sỹ, Quận Tân Bình, TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&q=80',
    tags: ['Gà rán', 'Burger']
  }
]

export function StoreListPage() {
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
            <MapPin size={16} className="text-[--color-brand-500]" />
            <span className="text-sm font-medium text-[--color-ink-secondary]">Sắp xếp: Gần nhất</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_STORES.map(store => (
            <Link 
              key={store.id} 
              to={`/stores/${store.id}`}
              className="bg-white rounded-[1.5rem] p-4 flex flex-col sm:flex-row gap-5 shadow-[--shadow-card] hover:shadow-[--shadow-card-hover] hover:-translate-y-1 transition-all duration-300 border border-[--color-surface-border] group"
            >
              {/* Image */}
              <div className="w-full sm:w-32 h-40 sm:h-auto rounded-[1rem] overflow-hidden shrink-0 bg-gray-100">
                <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              
              {/* Content */}
              <div className="flex flex-col flex-1 py-1">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-[--color-brand-600] bg-[--color-brand-50] px-2 py-0.5 rounded-md">{store.category}</span>
                  <div className="flex items-center gap-1 bg-[#fff8e1] px-2 py-0.5 rounded-md text-[#f59e0b]">
                    <Star size={12} fill="currentColor" />
                    <span className="text-xs font-bold">{store.rating}</span>
                  </div>
                </div>
                
                <h3 className="font-bold text-lg text-[--color-ink-primary] mb-1 group-hover:text-[--color-brand-600] transition-colors">{store.name}</h3>
                
                <div className="flex items-start gap-1.5 text-[--color-ink-secondary] text-sm mb-3">
                  <MapPin size={14} className="mt-0.5 shrink-0" />
                  <span className="line-clamp-1">{store.address} ({store.distance})</span>
                </div>
                
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex gap-2">
                    {store.tags.map(tag => (
                      <span key={tag} className="text-[11px] text-[--color-ink-tertiary] border border-[--color-surface-border] px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[--color-surface-muted] flex items-center justify-center group-hover:bg-[--color-brand-500] group-hover:text-white transition-colors">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
