import { Leaf, ShoppingCart, Menu, X, Search, ClipboardList, Store } from 'lucide-react'
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
import { NotificationDropdown } from '@/components/layout/NotificationDropdown'
import { GlobalSearchBar } from '@/components/ui/search/GlobalSearchBar'

function CartBadge() {
  const { data: cartItems } = useCart()
  if (!cartItems || cartItems.length === 0) return null

  const count = cartItems.length
  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full pointer-events-none">
      {count > 9 ? '9+' : count}
    </span>
  )
}

function MiniCartPopover() {
  const { data: cartItems } = useCart()
  
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="absolute top-full right-0 pt-2 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
          <ShoppingCart className="text-gray-300 mb-3" size={40} />
          <p className="text-gray-500 font-medium">Chưa có sản phẩm</p>
        </div>
      </div>
    )
  }

  const recentItems = [...cartItems].reverse().slice(0, 5)

  return (
    <div className="absolute top-full right-0 pt-2 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-3 bg-gray-50 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500">Sản phẩm mới thêm</h3>
        </div>
      <div className="max-h-80 overflow-y-auto">
        {recentItems.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
            <div className="w-12 h-12 rounded bg-gray-100 shrink-0 overflow-hidden border border-gray-200">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">No Img</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
              <div className="flex items-center justify-between mt-1">
                <span className="text-brand-600 text-sm font-bold">{item.salePrice.toLocaleString()}đ</span>
                <span className="text-xs text-gray-500">x{item.quantity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
          <span>{cartItems.length > 5 ? `${cartItems.length - 5} sản phẩm khác` : ''}</span>
        </div>
        <Link 
          to={ROUTES.CART}
          className="block w-full py-2 bg-brand-500 text-white text-center rounded-lg font-bold hover:bg-brand-600 transition-colors"
        >
          Xem giỏ hàng
        </Link>
      </div>
      </div>
    </div>
  )
}

// ─── Navbar Component ─────────────────────────────────────────────────────────
// Thanh điều hướng dùng chung cho toàn bộ ứng dụng.
// Đồng bộ style "glass pills" cho tất cả các trang, tuỳ biến dark/light tuỳ vị trí scroll.

const NAV_LINKS = [
  { label: 'Trang chủ',   href: ROUTES.HOME },
  { label: 'Đồ ăn cận date', href: ROUTES.PRODUCTS },
  { label: 'Cửa hàng',    href: ROUTES.STORES },
]

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
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

          {/* ── Actions (Location, Search, & Desktop only: Orders, Cart, Auth) ── */}
          <div className={`flex items-center transition-all duration-500 rounded-full pl-3 md:pl-5 pr-1.5 py-1.5 gap-2 md:gap-4 ${pillStyle}`}>
            
            {/* Location Button */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${isDark ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              title="Thay đổi vị trí giao hàng"
            >
              <MapPin width={16} height={16} className={isDark ? 'text-green-300' : 'text-green-600'} />
              <span className="max-w-[120px] truncate">
                {isLocLoading ? 'Đang lấy vị trí...' : (userLocation?.address === 'Vị trí đã chọn' ? 'Vị trí' : userLocation?.address || 'Chọn vị trí')}
              </span>
            </button>

            {/* Search */}
            <GlobalSearchBar variant="header" isDark={isDark} />

            {/* Notification Bell (Mobile Only) */}
            {isAuthenticated && (
              <div className="flex md:hidden relative items-center pl-1">
                <NotificationDropdown isDark={isDark} />
              </div>
            )}

            {/* Orders (Desktop Only) */}
            {isAuthenticated && (
              <Link
                to={ROUTES.MY_ORDERS}
                className={`hidden md:flex relative p-1.5 rounded-full transition-all duration-300 ${isDark ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                title="Đơn hàng của tôi"
              >
                <ClipboardList width={18} height={18} />
              </Link>
            )}

            {/* Cart (Desktop Only) */}
            <div className="hidden md:flex relative group">
              <Link
                to={ROUTES.CART}
                className={`relative p-1.5 rounded-full transition-all duration-300 ${isDark ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                title="Giỏ hàng"
              >
                <ShoppingCart width={18} height={18} />
                {isAuthenticated && <CartBadge />}
              </Link>
              {/* Popover Hover */}
              {isAuthenticated && <MiniCartPopover />}
            </div>

            {/* ── Auth buttons (Desktop Only) ── */}
            {isAuthenticated && user ? (
                <div className="hidden md:flex items-center gap-3 ml-2">
                  {user.roles?.some(r => r.toUpperCase() === 'STORE') && (
                    <Link 
                      to={ROUTES.DASHBOARD} 
                      className={`relative p-1.5 rounded-full transition-all duration-300 mr-1 ${isDark ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                      title="Quản lý cửa hàng"
                    >
                      <Store width={18} height={18} />
                    </Link>
                  )}
                  <div className="mr-1 flex items-center">
                    <NotificationDropdown isDark={isDark} />
                  </div>
                  <Link to={ROUTES.PROFILE} className={`flex items-center gap-2 border-l pl-3 transition-colors group ${isDark ? 'border-white/20' : 'border-gray-200'}`} title={user.fullName}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs ${isDark ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <button onClick={async () => {
                    try {
                      await logoutMutation.mutateAsync();
                      navigate(ROUTES.LOGIN);
                    } catch (e) {
                      navigate(ROUTES.LOGIN);
                    }
                  }} className={`text-sm font-medium mr-2 ${isDark ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>Thoát</button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-3 ml-1">
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
            }
          </div>

        </div>
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
                  setLocation(lat, lng, 'Vị trí');
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
