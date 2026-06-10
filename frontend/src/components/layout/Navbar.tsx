import { Leaf, ShoppingCart, Menu, X, Search, ClipboardList } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { useAuthContext } from '@/contexts/AuthContext'
import { useLogout } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { MapPin } from 'lucide-react'
import { useLocationContext } from '@/contexts/LocationContext'
import { LocationPickerMap } from '@/components/map/LocationPickerMap'
function CartBadge() {
  const { data: cartItems } = useCart()
  if (!cartItems || cartItems.length === 0) return null

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center pointer-events-none">
      {cartItems.length > 9 ? '9+' : cartItems.length}
    </span>
  )
}

// ─── Navbar Component ─────────────────────────────────────────────────────────
// Thanh điều hướng dùng chung cho toàn bộ ứng dụng.
// Đồng bộ style "glass pills" cho tất cả các trang, tuỳ biến dark/light tuỳ vị trí scroll.

const NAV_LINKS = [
  { label: 'Trang chủ (🚧)',   href: ROUTES.HOME },
  { label: 'Đồ ăn cận date (🚧)', href: ROUTES.PRODUCTS },
  { label: 'Cửa hàng (🚧)',    href: ROUTES.STORES },
]

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthContext()
  const logoutMutation = useLogout()
  
  const { location: userLocation, setLocation, isLoading: isLocLoading } = useLocationContext()
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  const isHome = location.pathname === ROUTES.HOME
  const isProducts = location.pathname === ROUTES.PRODUCTS
  
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsSearchOpen(false)
    const qs = new URLSearchParams(location.search)
    setSearchQuery(qs.get('q') || '')
  }, [location.pathname, location.search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`${ROUTES.PRODUCTS}?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
    }
  }

  const isActive = (href: string) =>
    href === ROUTES.HOME
      ? location.pathname === href
      : location.pathname.startsWith(href)

  const isStores = location.pathname === ROUTES.STORES || (location.pathname.startsWith('/stores/') && location.pathname !== ROUTES.STORE_REGISTER)
  
  // Các trang có Hero Banner nền tối ở đầu trang
  const isDarkHeroPage = isHome || isProducts || isStores
  const isDark = isDarkHeroPage && !isScrolled && !isMobileMenuOpen

  // Pill styles: Luôn giữ layout 3 block (pills), chỉ đổi màu theo nền
  const pillStyle = isDark 
    ? 'bg-white/10 backdrop-blur-md border border-white/20 shadow-sm text-white' 
    : 'bg-white/90 backdrop-blur-md border border-gray-200 shadow-sm text-[--color-ink-primary]'

  return (
    <header className="fixed top-0 w-full z-50 transition-all duration-500 bg-transparent py-4 pointer-events-none">
      <nav
        className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8 pointer-events-auto"
        aria-label="Điều hướng chính"
      >
        <div className="flex items-center justify-between h-14">

          {/* ── Logo ── */}
          <Link
            to={ROUTES.HOME}
            className={`flex items-center gap-2 group transition-all duration-500 rounded-full px-4 py-2 ${pillStyle}`}
            aria-label="SaveFood — Trang chủ"
          >
            {/* Logo LUÔN giữ màu xanh trong suốt để đồng bộ như user yêu cầu */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent">
              <Leaf width={20} height={20} className="text-[#8ced7f]" strokeWidth={2} aria-hidden="true" />
            </div>
            <span className="font-bold text-lg font-[--font-display] transition-colors">
              SaveFood
            </span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div className={`hidden md:flex items-center transition-all duration-500 rounded-full p-1 gap-1 ${pillStyle}`}>
            {NAV_LINKS.map(link => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={[
                    'px-5 py-2 rounded-full text-sm font-medium transition-all duration-300',
                    active
                      ? (isDark ? 'bg-white/20 text-white font-bold shadow-sm' : 'bg-brand-100 text-brand-700 font-bold shadow-sm')
                      : (isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-muted'),
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* ── Desktop Actions ── */}
          <div className={`hidden md:flex items-center transition-all duration-500 rounded-full pl-5 pr-1.5 py-1.5 gap-4 ${pillStyle}`}>
            
            {/* Location Button */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${isDark ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              title="Thay đổi vị trí giao hàng"
            >
              <MapPin width={16} height={16} className={isDark ? 'text-green-300' : 'text-green-600'} />
              <span className="max-w-[120px] truncate">
                {isLocLoading ? 'Đang lấy vị trí...' : (userLocation?.address || 'Chọn vị trí')}
              </span>
            </button>

            {/* Search */}
            <div className="relative flex items-center">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Tìm món ăn..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-40 sm:w-48 bg-transparent border-none outline-none text-sm px-2 ${isDark ? 'text-white placeholder:text-white/50' : 'text-gray-800 placeholder:text-gray-400'}`}
                  />
                  <button type="submit" className={`p-1.5 rounded-full ${isDark ? 'hover:bg-white/20' : 'hover:bg-gray-100'}`}>
                    <Search width={16} height={16} />
                  </button>
                  <button type="button" onClick={() => setIsSearchOpen(false)} className={`p-1.5 rounded-full ml-1 ${isDark ? 'hover:bg-white/20' : 'hover:bg-gray-100'}`}>
                    <X width={16} height={16} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className={`p-1.5 rounded-full transition-all duration-300 ${isDark ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                  aria-label="Tìm kiếm"
                >
                  <Search width={18} height={18} />
                </button>
              )}
            </div>

            {/* Orders */}
            {!isSearchOpen && isAuthenticated && (
              <Link
                to={ROUTES.MY_ORDERS}
                className={`relative p-1.5 rounded-full transition-all duration-300 ${isDark ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                title="Đơn hàng của tôi"
              >
                <ClipboardList width={18} height={18} />
              </Link>
            )}

            {/* Cart */}
            {!isSearchOpen && (
              <Link
                to={ROUTES.CART}
                className={`relative p-1.5 rounded-full transition-all duration-300 ${isDark ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                title="Giỏ hàng"
              >
                <ShoppingCart width={18} height={18} />
                {isAuthenticated && <CartBadge />}
              </Link>
            )}

            {/* ── Auth buttons ── */}
            {!isSearchOpen && (
              isAuthenticated && user ? (
                <div className="flex items-center gap-3 ml-2">
                  <Link to={ROUTES.PROFILE} className={`flex items-center gap-2 border-l pl-3 transition-colors group ${isDark ? 'border-white/20' : 'border-gray-200'}`} title={user.fullName}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs ${isDark ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <button onClick={() => logoutMutation.mutate()} className={`text-sm font-medium mr-2 ${isDark ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>Thoát</button>
                </div>
              ) : (
                <div className="flex items-center gap-3 ml-1">
                  <Link to={ROUTES.LOGIN} className={`text-sm font-medium transition-colors ${isDark ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                    Đăng nhập
                  </Link>
                  <Link to={ROUTES.REGISTER}>
                    <button className="bg-[#8ced7f] hover:bg-[#7bde6c] text-[#0f2913] text-sm font-bold rounded-full px-5 py-2 transition-all duration-300 shadow-sm">
                      Đăng ký
                    </button>
                  </Link>
                </div>
              )
            )}
          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            className={`md:hidden p-2 rounded-full transition-all duration-300 ${pillStyle}`}
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {isMobileMenuOpen ? <X width={22} height={22} /> : <Menu width={22} height={22} />}
          </button>
        </div>

        {/* ── Mobile Menu ── */}
        {isMobileMenuOpen && (
          <div className={`md:hidden mt-4 rounded-2xl p-4 space-y-2 animate-[--animate-slide-up] ${pillStyle}`}>
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={[
                  'block px-4 py-3 rounded-[1rem] font-medium transition-colors',
                  isActive(link.href)
                    ? (isDark ? 'bg-white/20 text-white font-bold' : 'bg-brand-50 text-brand-700 font-bold')
                    : (isDark ? 'text-white/80 hover:bg-white/10' : 'text-ink-secondary hover:bg-surface-muted'),
                ].join(' ')}
              >
                {link.label}
              </Link>
            ))}

            <div className="flex gap-2 pt-2 mt-2 border-t border-gray-200/20">
              <Link to={ROUTES.LOGIN} className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                <button className={`w-full py-2.5 rounded-full font-bold border ${isDark ? 'border-white/30 text-white hover:bg-white/10' : 'border-gray-200 text-gray-800 hover:bg-gray-50'}`}>Đăng nhập</button>
              </Link>
              <Link to={ROUTES.REGISTER} className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                <button className="w-full py-2.5 rounded-full font-bold bg-[#8ced7f] text-[#0f2913] hover:bg-[#7bde6c]">Đăng ký</button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Location Picker Modal ── */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-[--animate-slide-up]">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="text-green-600" width={20} height={20} />
                Vị trí của bạn
              </h3>
              <button onClick={() => setIsLocationModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                <X width={20} height={20} />
              </button>
            </div>
            <div className="p-4 bg-gray-50/50">
              <LocationPickerMap
                onLocationChange={(lat, lng) => {
                  setLocation(lat, lng, 'Vị trí đã chọn');
                }}
                defaultPosition={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined}
                searchTriggerAddress={userLocation?.address}
              />
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
              <button 
                onClick={() => setIsLocationModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Đóng
              </button>
              <button 
                onClick={() => setIsLocationModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
