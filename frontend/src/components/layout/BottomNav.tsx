import { Link, useLocation } from 'react-router-dom';
import { Home, Tag, Store, ShoppingCart, User } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';

function BottomCartBadge() {
  const { data: cartItems } = useCart();
  if (!cartItems || cartItems.length === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center pointer-events-none">
      {cartItems.length > 9 ? '9+' : cartItems.length}
    </span>
  );
}

export function BottomNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();

  const NAV_ITEMS = [
    { label: 'Trang chủ', href: ROUTES.HOME, icon: Home },
    { label: 'Ưu đãi', href: ROUTES.PRODUCTS, icon: Tag },
    { label: 'Cửa hàng', href: ROUTES.STORES, icon: Store },
    { label: 'Giỏ hàng', href: ROUTES.CART, icon: ShoppingCart, isCart: true },
    { label: 'Tài khoản', href: isAuthenticated ? ROUTES.PROFILE : ROUTES.LOGIN, icon: User },
  ];

  const isActive = (href: string) => {
    if (href === ROUTES.HOME) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden z-[9999] bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" 
         style={{ position: 'fixed', bottom: 0, left: 0, right: 0, width: '100%', height: 'calc(64px + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex justify-around items-center h-[64px] px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                active ? 'text-brand-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                <Icon width={24} height={24} className={active ? 'stroke-[2.5px]' : 'stroke-2'} />
                {item.isCart && isAuthenticated && <BottomCartBadge />}
              </div>
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
