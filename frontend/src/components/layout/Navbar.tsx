import { Leaf, ShoppingCart, Menu, X, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { useAuthContext } from '@/contexts/AuthContext'
import { useLogout } from '@/hooks/useAuth'

// ─── Navbar Component ─────────────────────────────────────────────────────────
// Thanh điều hướng dùng chung cho toàn bộ ứng dụng.
// Responsive: Desktop (full links) | Mobile (hamburger menu).

const NAV_LINKS = [
  { label: 'Trang chủ',   href: ROUTES.HOME },
  { label: 'Đồ ăn cận date', href: ROUTES.PRODUCTS },
  { label: 'Cửa hàng',    href: ROUTES.STORES },
]

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated, user } = useAuthContext()
  const logoutMutation = useLogout()

  const isActive = (href: string) =>
    href === ROUTES.HOME
      ? location.pathname === href
      : location.pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-50 bg-[--color-surface-base]/95 backdrop-blur-sm border-b border-[--color-surface-border]">
      <nav
        className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8"
        aria-label="Điều hướng chính"
      >
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2 group"
            aria-label="SaveFood — Trang chủ"
          >
            <div className="w-8 h-8 rounded-[--radius-button] bg-[--color-brand-500] flex items-center justify-center group-hover:bg-[--color-brand-600] transition-colors">
              <Leaf width={18} height={18} className="text-white" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <span className="font-bold text-[--text-heading-sm] text-[--color-ink-primary] font-[--font-display]">
              SaveFood
            </span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={[
                  'px-3 py-2 rounded-[--radius-button] text-[--text-body-sm] font-medium transition-colors',
                  isActive(link.href)
                    ? 'bg-[--color-brand-50] text-[--color-brand-700]'
                    : 'text-[--color-ink-secondary] hover:text-[--color-ink-primary] hover:bg-[--color-surface-muted]',
                ].join(' ')}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Desktop Actions ── */}
          <div className="hidden md:flex items-center gap-2">
            {/* Search button */}
            <button
              className="p-2 rounded-[--radius-button] text-[--color-ink-secondary] hover:bg-[--color-surface-muted] transition-colors"
              aria-label="Tìm kiếm"
            >
              <Search width={20} height={20} />
            </button>

            {/* Cart */}
            <Link
              to={ROUTES.CART}
              className="p-2 rounded-[--radius-button] text-[--color-ink-secondary] hover:bg-[--color-surface-muted] transition-colors relative"
              aria-label="Giỏ hàng"
            >
              <ShoppingCart width={20} height={20} />
            </Link>

            {/* ── Auth buttons ── */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <Link to={ROUTES.PROFILE} className="text-[--text-body-sm] font-medium text-[--color-ink-primary] hover:text-[--color-brand-600]">
                  Hồ sơ
                </Link>
                <Link to={ROUTES.WISHLIST} className="text-[--text-body-sm] font-medium text-[--color-ink-primary] hover:text-[--color-brand-600]">
                  Yêu thích
                </Link>
                <span className="text-[--text-body-sm] text-[--color-ink-secondary] border-l border-[--color-surface-border] pl-4">
                  Chào, {user.fullName}
                </span>
                <Button variant="ghost" size="sm" onClick={() => logoutMutation.mutate()}>
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <>
                <Link to={ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm">Đăng nhập</Button>
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <Button size="sm">Đăng ký</Button>
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            className="md:hidden p-2 rounded-[--radius-button] text-[--color-ink-secondary] hover:bg-[--color-surface-muted]"
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {isMobileMenuOpen ? <X width={22} height={22} /> : <Menu width={22} height={22} />}
          </button>
        </div>

        {/* ── Mobile Menu ── */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[--color-surface-border] py-3 pb-4 space-y-1 animate-[--animate-slide-up]">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={[
                  'block px-3 py-2.5 rounded-[--radius-button] text-[--text-body-md] font-medium transition-colors',
                  isActive(link.href)
                    ? 'bg-[--color-brand-50] text-[--color-brand-700]'
                    : 'text-[--color-ink-secondary] hover:bg-[--color-surface-muted]',
                ].join(' ')}
              >
                {link.label}
              </Link>
            ))}

            <div className="flex gap-2 px-3 pt-2">
              <Link to={ROUTES.LOGIN} className="flex-1">
                <Button variant="outline" fullWidth size="sm">Đăng nhập</Button>
              </Link>
              <Link to={ROUTES.REGISTER} className="flex-1">
                <Button fullWidth size="sm">Đăng ký</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
