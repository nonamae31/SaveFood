import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Store, LogOut, Menu, X, ChevronRight, Package, Tag, Settings, LayoutDashboard, ShoppingCart, ScanLine } from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { useAuthContext } from '@/contexts/AuthContext'
import { useLogout } from '@/hooks/useAuth'
import { useStoreProfile } from '@/hooks/useStores'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function DashboardLayout() {
  const { user, isLoading } = useAuthContext()
  const { data: storeProfile } = useStoreProfile(user?.storeId || undefined)
  const logoutMutation = useLogout()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      navigate(ROUTES.LOGIN)
    } catch (e) {
      console.error(e)
      navigate(ROUTES.LOGIN)
    }
  }

  // Staff (staffRole=2) chỉ thấy Listings + Pickup; Owner/Manager thấy full menu
  const isStaffOnly = user?.staffRole === 2
  
  // If staff tries to access analytics (default dashboard route), redirect them to listings
  if (!isLoading && isStaffOnly && (location.pathname === ROUTES.DASHBOARD || location.pathname === ROUTES.DASHBOARD_ANALYTICS)) {
    return <Navigate to={ROUTES.DASHBOARD_LISTINGS} replace />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  const staffNavItems = [
    { name: 'Đợt giảm giá', href: ROUTES.DASHBOARD_LISTINGS, icon: Tag },
    { name: 'Đơn hàng', href: ROUTES.DASHBOARD_ORDERS, icon: ShoppingCart },
    { name: 'Nhận hàng', href: ROUTES.DASHBOARD_PICKUP, icon: ScanLine },
  ]

  const ownerNavItems = [
    { name: 'Tổng quan', href: ROUTES.DASHBOARD_ANALYTICS, icon: LayoutDashboard },
    { name: 'Sản phẩm', href: '/dashboard/products', icon: Package },
    { name: 'Đợt giảm giá', href: ROUTES.DASHBOARD_LISTINGS, icon: Tag },
    { name: 'Đơn hàng', href: ROUTES.DASHBOARD_ORDERS, icon: ShoppingCart },
    { name: 'Cài đặt cửa hàng', href: ROUTES.DASHBOARD_SETTINGS, icon: Settings },
  ]

  const navItems = isStaffOnly ? staffNavItems : ownerNavItems

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[--color-brand-500] rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-display text-gray-900 tracking-tight">SaveFood <span className="text-[--color-brand-600]">Store</span></span>
          </div>
          <button 
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
            {isStaffOnly ? 'Nhân viên' : 'Quản lý cửa hàng'}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-[--color-brand-50] text-[--color-brand-700]" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-[--color-brand-600]" : "text-gray-400 group-hover:text-gray-600"
                    )} />
                    {item.name}
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-[--color-brand-600]" />}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User & Store Profile Area */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mb-2 group">
            <div className="w-10 h-10 rounded-full bg-[--color-brand-100] flex items-center justify-center overflow-hidden shrink-0 border border-[--color-brand-200]">
              {storeProfile?.logoUrl ? (
                <img src={storeProfile.logoUrl} alt={storeProfile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-[--color-brand-700]">
                  {storeProfile?.name?.charAt(0).toUpperCase() || user?.fullName?.charAt(0).toUpperCase() || 'S'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate group-hover:text-[--color-brand-600] transition-colors" title={storeProfile?.name || 'Cửa hàng'}>
                {storeProfile?.name || 'Cửa hàng'}
              </p>
              <p className="text-xs text-gray-500 truncate" title={user?.fullName || user?.email}>
                {user?.fullName || user?.email}
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 sticky top-0 z-30">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="ml-2 font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-[--color-brand-600]" />
            SaveFood Store
          </div>
        </header>

        {/* Outlet Content */}
        <div key={location.pathname} className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 animate-[--animate-fade-in] duration-300">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
