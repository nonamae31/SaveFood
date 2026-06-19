import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Zap, Shield, ArrowRight, ArrowLeft, Store, MapPin, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { ROUTES } from '@/lib/constants';
import { LocationPickerMap } from '@/components/map/LocationPickerMap';
import { Select } from '@/components/ui/Select';

type BillingCycle = 'monthly' | 'semiannual' | 'annual';

interface EsgooLocation {
  id: string;
  name: string;
  full_name: string;
}

export default function StoreRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // API Locations State (v2 - No Districts)
  const [provinces, setProvinces] = useState<EsgooLocation[]>([]);
  const [wards, setWards] = useState<EsgooLocation[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedWardId, setSelectedWardId] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    description: '',
    detailedAddress: '',
    ward: '',
    city: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    subscriptionPlanId: '',
    billingCycle: 'monthly' as BillingCycle,
    referenceLink: '',
    storefrontImage: null as File | null,
  });

  const [searchTriggerAddress, setSearchTriggerAddress] = useState('');

  // Fetch Provinces on Mount (using provinces.open-api.vn)
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/v2/p/')
      .then(res => res.json())
      .then((data: any[]) => {
        setProvinces(data.map(p => ({ id: String(p.code), name: p.name, full_name: p.name })));
      })
      .catch(err => console.error('Error fetching provinces:', err));
  }, []);

  // Fetch Wards (All wards for the province, v2 API)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData(prev => ({ ...prev, storefrontImage: e.target.files![0] }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTriggerSearch = () => {
    const parts = [formData.detailedAddress, formData.ward, formData.city].filter(Boolean);
    if (parts.length > 0) {
      setSearchTriggerAddress(parts.join(', '));
    } else {
      toast.error('Vui lòng nhập ít nhất một trường địa chỉ để định vị!');
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.phoneNumber) {
        toast.error('Vui lòng điền các thông tin bắt buộc (Tên quán, SĐT)');
        return;
      }
    }
    if (step === 2) {
      if (!formData.detailedAddress || !formData.ward || !formData.city) {
        toast.error('Vui lòng điền/chọn đầy đủ địa chỉ bắt buộc (Tỉnh, Phường, Số nhà)');
        return;
      }
      if (!formData.latitude || !formData.longitude) {
        toast.error('Vui lòng chọn vị trí trên bản đồ');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setLoading(true);

      const realPlanId =
        planId === 'free' ? null :
          planId === 'plus-plan-id' ? '22222222-2222-2222-2222-222222222222' :
            planId === 'premium-plan-id' ? '33333333-3333-3333-3333-333333333333' : null;

      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('phoneNumber', formData.phoneNumber);
      payload.append('detailedAddress', formData.detailedAddress);
      payload.append('ward', formData.ward);
      payload.append('city', formData.city);
      payload.append('billingCycle', formData.billingCycle);
      if (formData.description) payload.append('description', formData.description);
      if (formData.latitude) payload.append('latitude', formData.latitude.toString());
      if (formData.longitude) payload.append('longitude', formData.longitude.toString());
      if (realPlanId) payload.append('subscriptionPlanId', realPlanId);
      if (formData.referenceLink) payload.append('referenceLink', formData.referenceLink);
      if (formData.storefrontImage) payload.append('storefrontImage', formData.storefrontImage);

      await import('@/api/client').then(m => m.apiClient('/stores/register', {
        method: 'POST',
        body: payload
      }));

      toast.success('Đăng ký cửa hàng thành công! Đơn của bạn đang chờ duyệt.', { duration: 5000 });
      navigate(ROUTES.HOME);
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi đăng ký cửa hàng');
    } finally {
      setLoading(false);
    }
  };

  const setBillingCycle = (cycle: BillingCycle) => {
    setFormData(prev => ({ ...prev, billingCycle: cycle }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-5 right-5 top-1/2 -translate-y-1/2 h-1 z-0">
              <div className="w-full h-full bg-gray-200 rounded-full"></div>
              <div
                className="absolute left-0 top-0 h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              ></div>
            </div>

            <div className={`relative z-10 flex flex-col items-center gap-2 ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors duration-300 ${step >= 1 ? 'bg-green-500 shadow-md shadow-green-200' : 'bg-gray-300'}`}>
                <Store className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold hidden sm:block">Cơ bản</span>
            </div>

            <div className={`relative z-10 flex flex-col items-center gap-2 ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors duration-300 ${step >= 2 ? 'bg-green-500 shadow-md shadow-green-200' : 'bg-gray-300'}`}>
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold hidden sm:block">Địa chỉ</span>
            </div>

            <div className={`relative z-10 flex flex-col items-center gap-2 ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors duration-300 ${step >= 3 ? 'bg-green-500 shadow-md shadow-green-200' : 'bg-gray-300'}`}>
                <Package className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold hidden sm:block">Chọn gói</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

          {step === 1 && (
            <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Thông tin cửa hàng</h2>
              <p className="text-gray-500 mb-8">Hãy bắt đầu bằng cách cho chúng tôi biết về cửa hàng của bạn.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tên cửa hàng <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="VD: Tiệm bánh Cô Ba"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại liên hệ <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="VD: 0901234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Link xác minh cửa hàng (Tùy chọn)</label>
                  <input
                    type="text"
                    name="referenceLink"
                    value={formData.referenceLink}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="VD: Link Google Maps, Fanpage Facebook..."
                  />
                  <p className="text-xs text-gray-500 mt-2">Cung cấp link để giúp chúng tôi xác minh cửa hàng của bạn dễ dàng hơn.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh mặt tiền cửa hàng (Tùy chọn)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-2">Ảnh chụp mặt tiền cửa hàng (có rõ biển hiệu) giúp tăng độ tin cậy.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả ngắn</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                    placeholder="Giới thiệu đôi nét về cửa hàng của bạn..."
                  />
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-8 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  Tiếp tục <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Vị trí cửa hàng</h2>
              <p className="text-gray-500 mb-8">Địa chỉ chính xác giúp khách hàng dễ dàng tìm đến bạn.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Thành phố / Tỉnh <span className="text-red-500">*</span></label>
                  <Select
                    searchable={true}
                    value={selectedProvinceId}
                    onChange={(val) => {
                      const id = String(val);
                      setSelectedProvinceId(id);
                      setSelectedWardId('');
                      const province = provinces.find(p => p.id === id);
                      setFormData(prev => ({ ...prev, city: province ? province.full_name : '', ward: '' }));
                    }}
                    options={provinces.map(p => ({ value: p.id, label: p.full_name }))}
                    placeholder="-- Chọn Thành phố / Tỉnh --"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phường / Xã <span className="text-red-500">*</span></label>
                  <Select
                    searchable={true}
                    value={selectedWardId}
                    disabled={!selectedProvinceId}
                    onChange={(val) => {
                      const id = String(val);
                      setSelectedWardId(id);
                      const ward = wards.find(w => w.id === id);
                      setFormData(prev => ({ ...prev, ward: ward ? ward.full_name : '' }));
                    }}
                    options={wards.map(w => ({ value: w.id, label: w.full_name }))}
                    placeholder="-- Chọn Phường / Xã --"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số nhà, Tên đường <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="detailedAddress"
                    value={formData.detailedAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="VD: 123 Lê Lợi"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-semibold text-gray-700">Ghim vị trí trên bản đồ <span className="text-red-500">*</span></label>
                    <button
                      onClick={handleTriggerSearch}
                      type="button"
                      className="px-4 py-2 bg-green-50 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4" /> Định vị theo địa chỉ trên
                    </button>
                  </div>
                  <LocationPickerMap
                    searchTriggerAddress={searchTriggerAddress}
                    onLocationChange={(lat, lng) => {
                      setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                    }}
                  />
                  {!formData.latitude && (
                    <p className="text-red-500 text-sm mt-2 font-medium">Vui lòng chấm ghim để lấy tọa độ chính xác.</p>
                  )}
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  className="px-8 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" /> Quay lại
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  Tiếp tục <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-8 md:p-12 bg-gray-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Chọn gói dịch vụ</h2>
                <p className="text-gray-500">Chọn gói phù hợp để bắt đầu bán hàng trên SaveFood ngay hôm nay.</p>
              </div>

              {/* Billing Cycle Toggle */}
              <div className="flex justify-center mb-10">
                <div className="inline-flex items-center p-1.5 bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${formData.billingCycle === 'monthly'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    1 Tháng
                  </button>
                  <button
                    onClick={() => setBillingCycle('semiannual')}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${formData.billingCycle === 'semiannual'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    6 Tháng
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${formData.billingCycle === 'annual'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    12 Tháng
                  </button>
                </div>
              </div>

              {/* Pricing Cards for Wizard - simpler layout */}
              <div className="grid md:grid-cols-3 gap-6">

                {/* FREE PLAN */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Gói Free</h3>
                  <div className="mb-6 h-[40px] flex items-end gap-1">
                    <span className="text-3xl font-extrabold text-gray-900">0đ</span>
                  </div>
                  <ul className="space-y-3 mb-6 flex-1 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-600">Tối đa 5 tin đăng</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-600">Thống kê cơ bản</span>
                    </li>
                  </ul>
                  <button
                    disabled={loading}
                    onClick={() => handleSubscribe('free')}
                    className="w-full py-3 rounded-xl border-2 border-gray-900 text-gray-900 font-bold hover:bg-gray-50 transition-colors"
                  >
                    Bắt đầu miễn phí
                  </button>
                </div>

                {/* PLUS PLAN */}
                <div className="bg-white rounded-2xl p-6 border-2 border-green-500 shadow-lg relative flex flex-col transform md:-translate-y-2">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Khuyên dùng
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Gói Plus</h3>
                  <div className="mb-6 h-[40px] flex items-end gap-1">
                    {formData.billingCycle === 'monthly' && <><span className="text-3xl font-extrabold text-gray-900">149k</span></>}
                    {formData.billingCycle === 'semiannual' && <><span className="text-3xl font-extrabold text-gray-900">799k</span></>}
                    {formData.billingCycle === 'annual' && <><span className="text-3xl font-extrabold text-gray-900">1.490k</span></>}
                  </div>
                  <ul className="space-y-3 mb-6 flex-1 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-600">Tối đa 15 tin đăng</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-600">Thống kê nâng cao</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-600">Banner tùy chỉnh</span>
                    </li>
                  </ul>
                  <button
                    disabled={loading}
                    onClick={() => handleSubscribe('plus-plan-id')}
                    className="w-full py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors shadow-md flex justify-center items-center gap-2"
                  >
                    {loading ? 'Đang xử lý...' : 'Chọn Plus'}
                  </button>
                </div>

                {/* PREMIUM PLAN */}
                <div className="bg-gradient-to-b from-white to-orange-50/50 rounded-2xl p-6 border border-gray-200 shadow-sm relative flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-1">
                    <Shield className="w-4 h-4 text-orange-500" /> Premium
                  </h3>
                  <div className="mb-6 h-[40px] flex items-end gap-1">
                    {formData.billingCycle === 'monthly' && <><span className="text-3xl font-extrabold text-gray-900">399k</span></>}
                    {formData.billingCycle === 'semiannual' && <><span className="text-3xl font-extrabold text-gray-900">2.149k</span></>}
                    {formData.billingCycle === 'annual' && <><span className="text-3xl font-extrabold text-gray-900">3.990k</span></>}
                  </div>
                  <ul className="space-y-3 mb-6 flex-1 text-sm">
                    <li className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <span className="text-gray-900 font-semibold">Không giới hạn tin đăng</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <span className="text-gray-600">Thống kê cao cấp</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-orange-500 shrink-0 mt-0.5 fill-current" />
                      <span className="text-gray-900 font-medium">Ưu tiên hiển thị</span>
                    </li>
                  </ul>
                  <button
                    disabled={loading}
                    onClick={() => handleSubscribe('premium-plan-id')}
                    className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors shadow-md flex justify-center items-center gap-2"
                  >
                    {loading ? 'Đang xử lý...' : 'Chọn Premium'}
                  </button>
                </div>

              </div>

              <div className="mt-10 flex items-center justify-start">
                <button
                  onClick={handlePrev}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
