import React, { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Lock, Image as ImageIcon, Upload, Star, Store, Loader2 } from 'lucide-react';
import { storeApi } from '@/api/store.api';

export default function DashboardSettingsPage() {
  const { user } = useAuthContext();
  
  // TODO: Fetch real subscription and store profile from backend API
  const [subscription] = useState({
    planName: 'Plus', // Thay đổi để test
    hasCustomBanner: true, 
  });

  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setBannerPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setLogoPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImages = async () => {
    if (!bannerFile && !logoFile) return;
    if (!user?.storeId) {
      setMessage({ type: 'error', text: 'Không tìm thấy ID cửa hàng.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      if (logoFile) formData.append('Logo', logoFile);
      if (bannerFile) formData.append('Banner', bannerFile);

      await storeApi.updateStoreImages(user.storeId, formData);
      
      setMessage({ type: 'success', text: 'Cập nhật hình ảnh thành công!' });
      // Reset files after upload
      setBannerFile(null);
      setLogoFile(null);
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || 'Có lỗi xảy ra khi lưu hình ảnh.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt Cửa hàng</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý hình ảnh và hiển thị của cửa hàng.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {message.text}
        </div>
      )}

      {/* SECTION: TẢI LÊN LOGO VÀ BANNER */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        
        {/* LOGO */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Store className="text-gray-500" size={20} />
            Ảnh đại diện cửa hàng (Logo)
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 bg-gray-100 flex-shrink-0 group">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="text-gray-400 w-10 h-10" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-white text-xs font-medium">Đổi ảnh</span>
              </div>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleLogoChange} />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Khuyên dùng ảnh vuông, kích thước tối thiểu 200x200px.</p>
              <p className="text-xs text-gray-400">Định dạng JPG, PNG. Tối đa 2MB.</p>
            </div>
          </div>
        </div>

        <hr className="border-gray-100 mb-8" />

        {/* BANNER */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="text-gray-500" size={20} />
              Ảnh bìa cửa hàng (Banner)
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-700 rounded-lg">
              Gói hiện tại: {subscription.planName}
            </span>
          </div>

          {!subscription.hasCustomBanner ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gray-100/50 flex flex-col items-center justify-center z-10 backdrop-blur-[1px]">
                <Lock className="w-8 h-8 text-gray-400 mb-2" />
                <h3 className="font-semibold text-gray-700 mb-1">Tính năng bị khóa</h3>
                <p className="text-sm text-gray-500 mb-4">Tính năng Tùy chỉnh Banner chỉ dành cho gói Plus và Premium.</p>
                <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-medium rounded-lg shadow-sm hover:from-green-700 hover:to-green-600 transition-colors flex items-center gap-2">
                  <Star size={16} /> Nâng cấp ngay
                </button>
              </div>
              
              <div className="opacity-30 pointer-events-none">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                  <span className="relative rounded-md font-semibold text-green-600">
                    Tải ảnh lên
                  </span>
                  <p className="pl-1">hoặc kéo thả vào đây</p>
                </div>
                <p className="text-xs leading-5 text-gray-500">PNG, JPG tối đa 5MB</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative">
                {bannerPreview ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden group">
                    <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <label className="cursor-pointer px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg shadow-sm">
                        Thay đổi ảnh bìa
                        <input type="file" className="hidden" accept="image/*" onChange={handleBannerChange} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                      <label className="relative cursor-pointer rounded-md font-semibold text-green-600 focus-within:outline-none hover:text-green-500">
                        <span>Tải ảnh bìa lên</span>
                        <input type="file" className="sr-only" accept="image/*" onChange={handleBannerChange} />
                      </label>
                      <p className="pl-1">hoặc kéo thả vào đây</p>
                    </div>
                    <p className="text-xs leading-5 text-gray-500">Kích thước khuyên dùng: 1200x400px (PNG, JPG tối đa 5MB)</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* ACTION BUTTON */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSaveImages}
            disabled={(!bannerFile && !logoFile) || isLoading} 
            className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Lưu hình ảnh
          </button>
        </div>
      </div>
    </div>
  );
}
