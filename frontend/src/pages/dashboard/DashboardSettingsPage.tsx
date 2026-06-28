import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { Lock, Image as ImageIcon, Upload, Star, Store, Loader2, Phone, MapPin, FileText, Save } from 'lucide-react';
import { storeApi } from '@/api/store.api';
import type { UpdateStoreProfileRequest } from '@/api/store.api';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { LocationPickerMap } from '@/components/map/LocationPickerMap';

interface EsgooLocation {
  id: string;
  name: string;
  full_name: string;
}

export default function DashboardSettingsPage() {
  const { user } = useAuthContext();
  const storeId = user?.storeId ?? '';
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // ── Subscription is now fetched along with the profile ───────────────────────

  // ── Image upload state ───────────────────────────────────────────────────────
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSavingImages, setIsSavingImages] = useState(false);

  // ── Store profile form state ─────────────────────────────────────────────────
  const [profile, setProfile] = useState<UpdateStoreProfileRequest>({
    name: '',
    description: '',
    detailedAddress: '',
    ward: '',
    city: '',
    phoneNumber: '',
    latitude: undefined,
    longitude: undefined,
  });
  const [planName, setPlanName] = useState('Free');
  const [hasCustomBanner, setHasCustomBanner] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ── Store Status State ───────────────────────────────────────────────────────
  const [storeStatus, setStoreStatus] = useState<number>(0);
  const [isDeleted, setIsDeleted] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, action: 'pause' | 'resume' | 'delete' | null, message: string }>({ isOpen: false, action: null, message: '' });

  // ── Locations State ─────────────────────────────────────────────────────────  // API Locations State (v2 - No Districts)
  const [provinces, setProvinces] = useState<EsgooLocation[]>([]);
  const [wards, setWards] = useState<EsgooLocation[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [searchTriggerAddress, setSearchTriggerAddress] = useState('');

  const [mapLink, setMapLink] = useState('');
  const [extracting, setExtracting] = useState(false);

  const handleExtractMapLink = async () => {
    if (!mapLink) return;
    setExtracting(true);
    try {
      const { apiClient } = await import('@/api/client');
      // apiClient already returns the parsed JSON
      const data = await apiClient<any>('/stores/extract-map-link', {
        method: 'POST',
        body: JSON.stringify({ url: mapLink }),
        headers: { 'Content-Type': 'application/json' }
      });

      let newDetailedAddress = profile.detailedAddress;
      
      if (data.latitude && data.longitude) {
        try {
          const geocodeRes = await fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&location=${data.longitude},${data.latitude}`);
          const geocodeData = await geocodeRes.json();
          if (geocodeData && geocodeData.address) {
            const addr = geocodeData.address;
            if (addr.Address) {
              newDetailedAddress = addr.Address;
            } else if (addr.Addr_type !== 'POI' && addr.Match_addr) {
              newDetailedAddress = addr.Match_addr;
            } else if (addr.LongLabel) {
              newDetailedAddress = addr.LongLabel.split(',')[0];
            }
          }
        } catch (geoErr) {
          console.error("Reverse geocode error:", geoErr);
        }
      }

      setProfile(prev => ({
        ...prev,
        name: data.name || prev.name,
        latitude: data.latitude || prev.latitude,
        longitude: data.longitude || prev.longitude,
        detailedAddress: newDetailedAddress
      }));

      toast.success('Đã lấy thông tin từ link thành công!');
    } catch (err: any) {
      toast.error('Link không hợp lệ, vui lòng kiểm tra lại');
    } finally {
      setExtracting(false);
    }
  };

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
            detailedAddress: data.detailedAddress,
            ward: data.ward,
            city: data.city,
            phoneNumber: data.phoneNumber,
            latitude: data.latitude,
            longitude: data.longitude,
          });
          setPlanName(data.planName);
          setHasCustomBanner(data.hasCustomBanner);
          setStoreStatus(data.status);
          setIsDeleted(data.isDeleted);
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

  // Fetch Provinces on Mount
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/v2/p/')
      .then(res => res.json())
      .then((data: any[]) => {
        setProvinces(data.map(p => ({ id: String(p.code), name: p.name, full_name: p.name })));
      })
      .catch(err => console.error('Error fetching provinces:', err));
  }, []);

  // Sync province code from profile.city
  useEffect(() => {
    if (provinces.length > 0 && profile.city && !selectedProvinceId) {
      const p = provinces.find(x => x.name === profile.city || x.full_name === profile.city);
      if (p) setSelectedProvinceId(p.id);
    }
  }, [provinces, profile.city]);

  // Fetch Wards when Province changes
  useEffect(() => {
    if (selectedProvinceId) {
      fetch(`https://provinces.open-api.vn/api/v2/w/?province_code=${selectedProvinceId}`)
        .then(res => res.json())
        .then((data: any[]) => {
          setWards(data.map(w => ({ id: String(w.code), name: w.name, full_name: w.name })));
        })
        .catch(err => console.error('Error fetching wards:', err));
    } else {
      setWards([]);
    }
  }, [selectedProvinceId]);

  // Sync ward code from profile.ward
  useEffect(() => {
    if (wards.length > 0 && profile.ward && !selectedWardId) {
      const w = wards.find(x => x.name === profile.ward || x.full_name === profile.ward);
      if (w) setSelectedWardId(w.id);
    }
  }, [wards, profile.ward]);

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

  const requestUpdateStatus = (action: 'pause' | 'resume' | 'delete') => {
    let message = '';
    if (action === 'pause') message = 'Bạn có chắc chắn muốn Tạm đóng cửa? Khách hàng sẽ không thể đặt hàng mới.';
    if (action === 'resume') message = 'Bạn có chắc chắn muốn Mở cửa lại? Khách hàng sẽ có thể đặt hàng bình thường.';
    if (action === 'delete') message = 'CẢNH BÁO NGUY HIỂM: Bạn có chắc chắn muốn Ngừng kinh doanh? Cửa hàng sẽ bị xóa khỏi hệ thống. Thao tác này không thể hoàn tác!';

    setConfirmModal({ isOpen: true, action, message });
  };

  const handleUpdateStatus = async () => {
    if (!storeId || !confirmModal.action) return;
    const action = confirmModal.action;
    setConfirmModal({ isOpen: false, action: null, message: '' });

    setIsUpdatingStatus(true);
    try {
      await storeApi.updateStoreStatus(storeId, action);
      toast.success('Cập nhật trạng thái thành công!');
      
      // Update local state
      if (action === 'pause') setStoreStatus(2); // Closed
      if (action === 'resume') setStoreStatus(0); // Active
      if (action === 'delete') {
        setStoreStatus(2);
        setIsDeleted(true);
      }
      
      queryClient.invalidateQueries({ queryKey: ['store-profile', storeId] });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra.';
      toast.error(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const setField = (key: keyof UpdateStoreProfileRequest, value: string | number | undefined) => {
    setProfile(prev => ({ ...prev, [key]: value || (typeof value === 'number' ? value : null) }));
  };

  const handleTriggerSearch = () => {
    const parts = [profile.detailedAddress, profile.ward, profile.city].filter(Boolean);
    if (parts.length > 0) {
      setSearchTriggerAddress(parts.join(', '));
    } else {
      toast.error('Vui lòng nhập ít nhất một trường địa chỉ để định vị!');
    }
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
            
            {/* Google Maps Quick Fill */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 relative overflow-hidden mb-2">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <MapPin className="w-24 h-24 text-blue-500" />
              </div>
              <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2 relative z-10">
                <MapPin className="w-4 h-4 text-blue-600" /> Điền nhanh bằng link Google Maps
              </h3>
              <div className="flex gap-2 relative z-10">
                <input
                  type="text"
                  value={mapLink}
                  onChange={(e) => setMapLink(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  placeholder="Dán link Google Maps vào đây (VD: https://maps.app.goo.gl/...)"
                />
                <button
                  type="button"
                  onClick={handleExtractMapLink}
                  disabled={!mapLink || extracting}
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {extracting ? 'Đang phân tích...' : 'Tự động điền'}
                </button>
              </div>
              <p className="text-xs text-blue-700 mt-2 relative z-10">
                Hệ thống sẽ tự động cập nhật tên quán, địa chỉ và tọa độ trên bản đồ.
              </p>
            </div>

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
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                <MapPin className="text-gray-500" size={16} />
                Địa chỉ chi tiết
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Thành phố / Tỉnh <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="city"
                    value={selectedProvinceId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedProvinceId(id);
                      setSelectedWardId('');
                      const name = e.target.options[e.target.selectedIndex].text;
                      setField('city', id ? name : '');
                      setField('ward', '');
                    }}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition bg-white text-gray-900"
                  >
                    <option className="text-gray-900 bg-white" value="">-- Chọn Thành phố / Tỉnh --</option>
                    {provinces.map(p => (
                      <option className="text-gray-900 bg-white" key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Phường / Xã <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="ward"
                    value={selectedWardId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedWardId(id);
                      const name = e.target.options[e.target.selectedIndex].text;
                      setField('ward', id ? name : '');
                    }}
                    disabled={!selectedProvinceId}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option className="text-gray-900 bg-white" value="">-- Chọn Phường / Xã --</option>
                    {wards.map(w => (
                      <option className="text-gray-900 bg-white" key={w.id} value={w.id}>{w.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Số nhà, tên đường <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.detailedAddress}
                  onChange={e => setField('detailedAddress', e.target.value)}
                  placeholder="VD: 123 Lê Lợi"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
                />
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Ghim vị trí trên bản đồ <span className="text-red-500">*</span></label>
                    <p className="text-xs text-gray-500">Giúp khách hàng tìm đường đến quán dễ dàng hơn</p>
                  </div>
                  <button
                    onClick={handleTriggerSearch}
                    type="button"
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 hover:text-green-600 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Định vị địa chỉ
                  </button>
                </div>
                <div className="h-[300px] w-full">
                  <LocationPickerMap 
                    searchTriggerAddress={searchTriggerAddress}
                    defaultPosition={profile.latitude && profile.longitude ? { lat: profile.latitude, lng: profile.longitude } : undefined}
                    onLocationChange={(lat, lng) => {
                      setField('latitude', lat);
                      setField('longitude', lng);
                    }}
                  />
                </div>
                {!profile.latitude && (
                  <div className="bg-red-50 p-2 text-center border-t border-red-100">
                    <p className="text-red-600 text-xs font-medium">Vui lòng chấm ghim để lấy tọa độ chính xác.</p>
                  </div>
                )}
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
              Gói hiện tại: {planName}
            </span>
          </div>

          {!hasCustomBanner ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gray-100/50 flex flex-col items-center justify-center z-10 backdrop-blur-[1px]">
                <Lock className="w-8 h-8 text-gray-400 mb-2" />
                <h3 className="font-semibold text-gray-700 mb-1">Tính năng bị khóa</h3>
                <p className="text-sm text-gray-500 mb-4">Tính năng Tùy chỉnh Banner chỉ dành cho gói Plus và Premium.</p>
                <button 
                  onClick={() => navigate(ROUTES.DASHBOARD_SUBSCRIPTION)}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-medium rounded-lg shadow-sm hover:from-green-700 hover:to-green-600 transition-colors flex items-center gap-2"
                >
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

      {/* ── SECTION 3: STORE STATUS ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          Trạng thái cửa hàng
        </h2>
        
        {isDeleted ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
            Cửa hàng của bạn đã ngừng kinh doanh và bị xóa khỏi hệ thống. Bạn không thể thay đổi thông tin hay trạng thái nữa.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {storeStatus === 0 ? 'Tạm đóng cửa' : 'Mở cửa lại'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {storeStatus === 0 
                    ? 'Tạm thời ẩn nút đặt hàng với khách hàng. Thích hợp khi nghỉ lễ, hết nguyên liệu.' 
                    : 'Mở lại cửa hàng để tiếp tục nhận đơn hàng từ khách hàng.'}
                </p>
              </div>
              <button
                onClick={() => requestUpdateStatus(storeStatus === 0 ? 'pause' : 'resume')}
                disabled={isUpdatingStatus}
                className={`px-4 py-2 font-medium rounded-xl transition-colors whitespace-nowrap flex items-center gap-2
                  ${storeStatus === 0 
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
              >
                {isUpdatingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
                {storeStatus === 0 ? 'Tạm đóng cửa' : 'Mở cửa lại'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
              <div>
                <h3 className="font-semibold text-red-700">Ngừng kinh doanh</h3>
                <p className="text-sm text-red-600/80 mt-1">
                  Hành động này sẽ xóa cửa hàng của bạn khỏi hệ thống. Không thể hoàn tác!
                </p>
              </div>
              <button
                onClick={() => requestUpdateStatus('delete')}
                disabled={isUpdatingStatus}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors whitespace-nowrap flex items-center gap-2"
              >
                {isUpdatingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
                Ngừng kinh doanh
              </button>
            </div>
          </div>
        )}
      </div>
      {/* ── CUSTOM CONFIRM MODAL ────────────────────────────────────────────── */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm transform transition-all">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmModal.message}</p>
            
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setConfirmModal({ isOpen: false, action: null, message: '' })}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateStatus}
                className={`flex-1 px-4 py-2 font-medium rounded-xl text-white transition-colors
                  ${confirmModal.action === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
