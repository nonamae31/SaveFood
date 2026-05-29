import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ROUTES } from '@/lib/constants';

export function MainLayout() {
  const location = useLocation();
  
  // Xác định các trang có Hero Banner (không cần padding top)
  const hasHeroBanner = 
    location.pathname === ROUTES.HOME ||
    location.pathname === ROUTES.PRODUCTS ||
    location.pathname === ROUTES.STORES ||
    location.pathname.startsWith('/stores/');

  return (
    <div className="flex flex-col min-h-screen bg-[--color-surface-subtle]">
      <Navbar />
      <main key={location.pathname} className={`flex-grow animate-[--animate-fade-in] duration-300 ${hasHeroBanner ? '' : 'pt-24'}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
