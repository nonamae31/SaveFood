import { useState } from 'react';
import { Check, Star, Zap, Shield, HelpCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

type BillingCycle = 'monthly' | 'semiannual' | 'annual';

export default function DashboardSubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const handleSubscribe = (planName: string) => {
    toast.error(`Tính năng thanh toán gói ${planName} đang được phát triển!`, {
      icon: '🚧',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12">
      {/* Header Section */}
      <div className="text-center space-y-4 pt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight font-display">
          Nâng Tầm Cửa Hàng Của Bạn
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Chọn gói phù hợp để tiếp cận thêm nhiều khách hàng, bán hàng nhanh hơn và quản lý chuyên nghiệp hơn trên SaveFood.
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1.5 bg-gray-100 rounded-2xl border border-gray-200">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            1 Tháng
          </button>
          <button
            onClick={() => setBillingCycle('semiannual')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              billingCycle === 'semiannual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            6 Tháng
            <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
              -10%
            </span>
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              billingCycle === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            12 Tháng
            <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
              Mua 10 tặng 2
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        
        {/* FREE PLAN */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Gói Free</h3>
            <p className="text-sm text-gray-500">Trải nghiệm cơ bản cho cửa hàng nhỏ</p>
          </div>
          <div className="mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-gray-900">0đ</span>
              <span className="text-gray-500 font-medium">/tháng</span>
            </div>
          </div>
          <div className="flex-1">
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-gray-600">Tối đa <strong className="text-gray-900">5</strong> tin đăng giải cứu</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-gray-600">Thống kê cơ bản</span>
              </li>
              <li className="flex items-start gap-3 opacity-40">
                <Check className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <span className="text-gray-500 line-through">Banner tùy chỉnh</span>
              </li>
              <li className="flex items-start gap-3 opacity-40">
                <Check className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <span className="text-gray-500 line-through">Huy hiệu Nổi bật</span>
              </li>
            </ul>
          </div>
          <button 
            disabled 
            className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-400 font-semibold cursor-not-allowed"
          >
            Gói hiện tại
          </button>
        </div>

        {/* PLUS PLAN */}
        <div className="bg-white rounded-3xl p-8 border-2 border-green-500 shadow-xl relative flex flex-col transform md:-translate-y-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-green-600 to-green-400 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-current" /> Khuyên dùng
          </div>
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Gói Plus</h3>
            <p className="text-sm text-gray-500">Dành cho cửa hàng vừa và bận rộn</p>
          </div>
          <div className="mb-8 h-[60px]">
            {billingCycle === 'monthly' && (
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-gray-900">149k</span>
                <span className="text-gray-500 font-medium">/tháng</span>
              </div>
            )}
            {billingCycle === 'semiannual' && (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">799k</span>
                  <span className="text-gray-500 font-medium">/6 tháng</span>
                </div>
                <p className="text-sm text-green-600 font-medium mt-1">Tiết kiệm ~10% (Gốc: 894k)</p>
              </div>
            )}
            {billingCycle === 'annual' && (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">1.490k</span>
                  <span className="text-gray-500 font-medium">/12 tháng</span>
                </div>
                <p className="text-sm text-green-600 font-medium mt-1">Mua 10 tháng tặng 2 tháng</p>
              </div>
            )}
          </div>
          <div className="flex-1">
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-gray-600">Tối đa <strong className="text-gray-900">15</strong> tin đăng giải cứu</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-gray-600">Thống kê nâng cao (biểu đồ & top SP)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-gray-600">Thêm Banner tùy chỉnh cho cửa hàng</span>
              </li>
              <li className="flex items-start gap-3 opacity-40">
                <Check className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <span className="text-gray-500 line-through">Ưu tiên hiển thị top tìm kiếm</span>
              </li>
            </ul>
          </div>
          <button 
            onClick={() => handleSubscribe('Plus')}
            className="w-full py-3.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            Nâng cấp Plus
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* PREMIUM PLAN */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col bg-gradient-to-b from-white to-orange-50/30">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Shield className="w-6 h-6 text-orange-500" /> Premium
            </h3>
            <p className="text-sm text-gray-500">Tối đa hóa doanh thu cho chuỗi lớn</p>
          </div>
          <div className="mb-8 h-[60px]">
            {billingCycle === 'monthly' && (
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-gray-900">399k</span>
                <span className="text-gray-500 font-medium">/tháng</span>
              </div>
            )}
            {billingCycle === 'semiannual' && (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">2.149k</span>
                  <span className="text-gray-500 font-medium">/6 tháng</span>
                </div>
                <p className="text-sm text-orange-600 font-medium mt-1">Tiết kiệm ~10% (Gốc: 2.394k)</p>
              </div>
            )}
            {billingCycle === 'annual' && (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">3.990k</span>
                  <span className="text-gray-500 font-medium">/12 tháng</span>
                </div>
                <p className="text-sm text-orange-600 font-medium mt-1">Mua 10 tháng tặng 2 tháng</p>
              </div>
            )}
          </div>
          <div className="flex-1">
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <span className="text-gray-900 font-semibold">Không giới hạn số lượng tin đăng</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <span className="text-gray-600">Thống kê cao cấp & Chuyên sâu</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <span className="text-gray-600">Banner tùy chỉnh</span>
              </li>
              <li className="flex items-start gap-3 bg-orange-50 p-2 rounded-lg -ml-2">
                <Star className="w-5 h-5 text-orange-500 shrink-0 mt-0.5 fill-current" />
                <span className="text-gray-900 font-medium">Ưu tiên lên top tìm kiếm + Huy hiệu Nổi Bật</span>
              </li>
            </ul>
          </div>
          <button 
            onClick={() => handleSubscribe('Premium')}
            className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center gap-2"
          >
            Trở thành Premium
          </button>
        </div>

      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto pt-12 border-t border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8 flex items-center justify-center gap-2">
          <HelpCircle className="text-gray-400" /> Câu hỏi thường gặp
        </h2>
        <div className="grid gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-2">Tôi có thể hủy hoặc đổi gói bất cứ lúc nào không?</h4>
            <p className="text-sm text-gray-600">Có, bạn có thể nâng cấp lên gói cao hơn bất cứ lúc nào. Số tiền của số ngày chưa sử dụng ở gói cũ sẽ được quy đổi và trừ vào giá gói mới.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-2">Gói Premium "Ưu tiên hiển thị" hoạt động như thế nào?</h4>
            <p className="text-sm text-gray-600">Sản phẩm của các cửa hàng Premium sẽ luôn được xuất hiện ở mục "Gợi ý hàng đầu" trên ứng dụng của khách hàng, đồng thời có khung viền và huy hiệu Nổi Bật để thu hút sự chú ý.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
