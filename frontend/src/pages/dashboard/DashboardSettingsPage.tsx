import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Lock, Image as ImageIcon, Upload, Star, Store, Loader2, Phone, MapPin, FileText, Save } from 'lucide-react';
import { storeApi } from '@/api/store.api';
import type { UpdateStoreProfileRequest } from '@/api/store.api';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function DashboardSettingsPage() {
  const { user } = useAuthContext();
  const storeId = user?.storeId ?? '';
  const queryClient = useQueryClient();

  // ── Subscription (still mock until subscription flow is built) ───────────────
  const [subscription] = useState({ planName: 'Plus', hasCustomBanner: true });

  // ── Image upload state ───────────────────────────────────────────────────────
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSavingImages, setIsSavingImages] = useState(false);

  // ── Store profile form state ─────────────────────────────────────────────────
  const [profile, setProfile] = useState<UpdateStoreProfileRequest>({
    name: '',
    description: null,
    addressLine: '',
    ward: null,
    district: '',
    city: '',
    phoneNumber: null,
  });
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ── Fetch profile on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;

    storeApi.getStoreProfile(storeId)
      .then(data => {
        if (!cancelled) {
          setProfile({
            name: data.name,
            description: data.description,
            addressLine: data.addressLine,
            ward: data.ward,
            district: data.district,
            city: data.city,
            phoneNumber: data.phoneNumber,
          });
          if (data.logoUrl) setLogoPreview(data.logoUrl);
          if (data.coverUrl) setBannerPreview(data.coverUrl);
          setIsFetchingProfile(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Không thể tải thông tin cửa hàng.');
          setIsFetchingProfile(false);
        }
      });

    return () => { cancelled = true; };
  }, [storeId]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setBannerPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setLogoPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImages = async () => {
    if (!bannerFile && !logoFile) return;
    if (!storeId) { toast.error('Không tìm thấy ID cửa hàng.'); return; }
    setIsSavingImages(true);
    try {
      const formData = new FormData();
      if (logoFile) formData.append('Logo', logoFile);
      if (bannerFile) formData.append('Banner', bannerFile);
      await storeApi.updateStoreImages(storeId, formData);
      toast.success('Cập nhật hình ảnh thành công!');
      
      // Invalidate store-profile query to update the logo in DashboardLayout sidebar immediately
      queryClient.invalidateQueries({ queryKey: ['store-profile', storeId] });

      setBannerFile(null);
      setLogoFile(null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu hình ảnh.';
      toast.error(msg);
    } finally {
      setIsSavingImages(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!storeId) { toast.error('Không tìm thấy ID cửa hàng.'); return; }
    setIsSavingProfile(true);
    try {
      await storeApi.updateStoreProfile(storeId, profile);
      toast.success('Lưu thông tin thành công!');
      queryClient.invalidateQueries({ queryKey: ['store-profile', storeId] });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu thông tin.';
      toast.error(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const setField = (key: keyof UpdateStoreProfileRequest, value: string) => {
    setProfile(prev => ({ ...prev, [key]: value || null }));
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt Cửa hàng</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý thông tin và hình ảnh hiển thị của cửa hàng.</p>
      </div>

      {/* ── SECTION 1: STORE PROFILE ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
          <Store className="text-gray-500" size={20} />
          Thông tin cửa hàng
        </h2>

        {isFetchingProfile ? (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <Loader2 className="animate-spin w-6 h-6 mr-2" />
            <span className="text-sm">Đang tải...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tên cửa hàng */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên cửa hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="VD: Tiệm Bánh Hạnh Phúc"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
              />
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <FileText size={14} className="text-gray-400" />
                Mô tả cửa hàng
              </label>
              <textarea
                value={profile.description ?? ''}
                onChange={e => setField('description', e.target.value)}
                rows={3}
                placeholder="Giới thiệu ngắn về cửa hàng của bạn..."
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition resize-none"
              />
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Phone size={14} className="text-gray-400" />
                Số điện thoại
              </label>
              <input
                type="tel"
                value={profile.phoneNumber ?? ''}
                onChange={e => setField('phoneNumber', e.target.value)}
                placeholder="VD: 0901 234 567"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
              />
            </div>

            {/* Địa chỉ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <MapPin size={14} className="text-gray-400" />
                Địa chỉ
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={profile.addressLine}
                  onChange={e => setField('addressLine', e.target.value)}
                  placeholder="Số nhà, tên đường *"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={profile.ward ?? ''}
                    onChange={e => setField('ward', e.target.value)}
                    placeholder="Phường / Xã"
                    className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
                  />
                  <input
                    type="text"
                    value={profile.district}
                    onChange={e => setField('district', e.target.value)}
                    placeholder="Quận / Huyện *"
                    className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
                  />
                  <input
                    type="text"
                    value={profile.city}
                    onChange={e => setField('city', e.target.value)}
                    placeholder="Tỉnh / Thành phố *"
                    className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save profile button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveProfile}
            disabled={isFetchingProfile || isSavingProfile}
            className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-colors"
          >
            {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={15} />}
            Lưu thông tin
          </button>
        </div>
      </div>

      {/* ── SECTION 2: IMAGES ────────────────────────────────────────────────── */}
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

        {/* Save images button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveImages}
            disabled={(!bannerFile && !logoFile) || isSavingImages}
            className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-colors"
          >
            {isSavingImages && <Loader2 className="w-4 h-4 animate-spin" />}
            Lưu hình ảnh
          </button>
        </div>
      </div>
    </div>
  );
}
