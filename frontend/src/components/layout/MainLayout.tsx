import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ROUTES } from '@/lib/constants';
import { useLocationContext } from '@/contexts/LocationContext';
import { LocationPickerMap } from '@/components/map/LocationPickerMap';
import { MapPin } from 'lucide-react';

export function MainLayout() {
  const routerLocation = useLocation();
  const { location, setLocation, isLocationDenied } = useLocationContext();
  const [tempLat, setTempLat] = useState<number | null>(null);
  const [tempLng, setTempLng] = useState<number | null>(null);
  
  // Xác định các trang có Hero Banner (không cần padding top)
  const hasHeroBanner = 
    routerLocation.pathname === ROUTES.HOME ||
    routerLocation.pathname === ROUTES.PRODUCTS ||
    routerLocation.pathname === ROUTES.STORES ||
    routerLocation.pathname.startsWith('/stores/');

  // Hiển thị modal bắt buộc nếu bị từ chối vị trí và chưa có vị trí nào
  const showForcedLocationModal = isLocationDenied && !location;

  return (
    <div className="flex flex-col min-h-screen bg-[--color-surface-subtle]">
      <Navbar />
      <main key={routerLocation.pathname} className={`flex-grow animate-[--animate-fade-in] duration-300 ${hasHeroBanner ? '' : 'pt-24'}`}>
        <Outlet />
      </main>
      <Footer />

      {/* Forced Location Modal */}
      {showForcedLocationModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md pointer-events-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-[--animate-fade-in]">
            <div className="p-6 text-center bg-orange-50 border-b border-orange-100">
              <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin width={32} height={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Bạn chưa cung cấp vị trí
              </h3>
              <p className="text-gray-600 text-sm">
                Chúng tôi không thể tự động lấy vị trí của bạn (do bạn đã từ chối quyền hoặc lỗi hệ thống).
                Để tìm kiếm các quán ăn giải cứu xung quanh, vui lòng chọn vị trí thủ công trên bản đồ dưới đây!
              </p>
            </div>
            <div className="p-4 bg-gray-50 flex flex-col gap-4">
              <LocationPickerMap
                onLocationChange={(lat, lng) => {
                  setTempLat(lat);
                  setTempLng(lng);
                }}
                defaultPosition={undefined}
                searchTriggerAddress={undefined}
              />
              <button
                disabled={tempLat === null || tempLng === null}
                onClick={() => {
                  if (tempLat !== null && tempLng !== null) {
                    setLocation(tempLat, tempLng, 'Vị trí đã chọn');
                  }
                }}
                className="w-full py-3 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Xác nhận & Bắt đầu sử dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
