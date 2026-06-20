import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, Star, Shield, HelpCircle, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { subscriptionApi } from '@/api/subscription.api';
import { storeApi } from '@/api/store.api';
import { apiClient } from '@/lib/apiClient';
import { useStoreAnalytics } from '@/hooks/useStores';

type BillingCycle = 'monthly' | 'semiannual' | 'annual';

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

export default function DashboardSubscriptionPage() {
  const { user } = useAuthContext();
  const storeId = user?.storeId ?? '';
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  // Xử lý khi trở về từ PayOS
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId');
    const code = params.get('code');
    const status = params.get('status');
    const cancel = params.get('cancel');

    if (orderId && code === '00' && status === 'PAID') {
      const verify = async () => {
        try {
          await apiClient(`/payments/verify/${orderId}`);
          toast.success('Thanh toán thành công! Gói đã được kích hoạt.');
        } catch (error) {
          console.error('Verify error:', error);
        }
      };
      verify();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (orderId && cancel === 'true') {
      toast.error('Thanh toán đã bị hủy.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const { data: analytics } = useStoreAnalytics(storeId);
  const currentPlanName = analytics?.planName || 'Free';
  const currentAnalyticsLevel = analytics?.analyticsLevel || 0;

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionApi.getAllPlans(),
  });

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) => storeApi.createSubscriptionCheckout(
      storeId, 
      planId, 
      billingCycle, 
      `${window.location.origin}/dashboard/subscription`, 
      `${window.location.origin}/dashboard/subscription`
    ),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Có lỗi xảy ra khi tạo thanh toán.');
    }
  });

  const handleSubscribe = (planId: string) => {
    if (!storeId) {
      toast.error('Không tìm thấy thông tin cửa hàng.');
      return;
    }
    checkoutMutation.mutate(planId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-[--color-brand-600] animate-spin" />
      </div>
    );
  }

  const activePlans = plans?.filter(p => p.isActive) || [];
  
  // Sort by price
  const sortedPlans = [...activePlans].sort((a, b) => a.monthlyPrice - b.monthlyPrice);

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
        {sortedPlans.map((plan) => {
          const isFree = plan.monthlyPrice === 0;
          const isPremium = plan.monthlyPrice > 200000;
          const isRecommended = !isFree && !isPremium; // e.g. the middle plan
          
          const isCurrentPlan = plan.name === currentPlanName;
          const isLowerPlan = plan.analyticsLevel < currentAnalyticsLevel;

          let displayPrice = plan.monthlyPrice;
          let subtitle = '';
          if (billingCycle === 'semiannual') {
            displayPrice = plan.monthlyPrice * 6 * 0.9;
            subtitle = 'Tiết kiệm ~10%';
          } else if (billingCycle === 'annual') {
            displayPrice = plan.monthlyPrice * 10;
            subtitle = 'Mua 10 tháng tặng 2 tháng';
          }

          return (
            <div 
              key={plan.id}
              className={`bg-white rounded-3xl p-8 border shadow-sm relative flex flex-col transition-shadow hover:shadow-md
                ${isRecommended ? 'border-2 border-green-500 shadow-xl md:-translate-y-4' : 'border-gray-200'}
                ${isPremium ? 'bg-gradient-to-b from-white to-orange-50/30' : ''}
              `}
            >
              {isRecommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-green-600 to-green-400 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current" /> Khuyên dùng
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  {isPremium && <Shield className="w-6 h-6 text-orange-500" />}
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </div>

              <div className="mb-8 h-[60px]">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">{isFree ? '0đ' : formatVND(displayPrice)}</span>
                  {!isFree && <span className="text-gray-500 font-medium">/{billingCycle === 'monthly' ? 'tháng' : (billingCycle === 'semiannual' ? '6 tháng' : '12 tháng')}</span>}
                </div>
                {subtitle && !isFree && (
                  <p className={`text-sm font-medium mt-1 ${isPremium ? 'text-orange-600' : 'text-green-600'}`}>
                    {subtitle}
                  </p>
                )}
              </div>

              <div className="flex-1">
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 mt-0.5 ${isPremium ? 'text-orange-500' : 'text-green-500'}`} />
                    <span className="text-gray-600">
                      Tối đa <strong className="text-gray-900">{plan.maxActiveListings}</strong> tin đăng
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 mt-0.5 ${isPremium ? 'text-orange-500' : 'text-green-500'}`} />
                    <span className="text-gray-600">Thống kê cấp độ {plan.analyticsLevel}</span>
                  </li>
                  <li className={`flex items-start gap-3 ${!plan.hasCustomBanner ? 'opacity-40' : ''}`}>
                    <Check className={`w-5 h-5 shrink-0 mt-0.5 ${!plan.hasCustomBanner ? 'text-gray-400' : (isPremium ? 'text-orange-500' : 'text-green-500')}`} />
                    <span className={!plan.hasCustomBanner ? 'text-gray-500 line-through' : 'text-gray-600'}>Banner tùy chỉnh</span>
                  </li>
                  <li className={`flex items-start gap-3 ${!plan.hasFeaturedBadge ? 'opacity-40' : (isPremium ? 'bg-orange-50 p-2 rounded-lg -ml-2' : '')}`}>
                    {plan.hasFeaturedBadge ? (
                       isPremium ? <Star className="w-5 h-5 text-orange-500 shrink-0 mt-0.5 fill-current" /> : <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <Check className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    )}
                    <span className={!plan.hasFeaturedBadge ? 'text-gray-500 line-through' : (isPremium ? 'text-gray-900 font-medium' : 'text-gray-600')}>Ưu tiên + Huy hiệu</span>
                  </li>
                </ul>
              </div>

              {isFree ? (
                <button disabled className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-400 font-semibold cursor-not-allowed">
                  {isCurrentPlan ? 'Đang sử dụng' : 'Gói mặc định'}
                </button>
              ) : (
                <button 
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={checkoutMutation.isPending || isCurrentPlan || isLowerPlan}
                  className={`w-full py-3.5 rounded-xl text-white font-semibold transition-colors shadow-md flex items-center justify-center gap-2
                    ${isPremium ? 'bg-gray-900 hover:bg-gray-800' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}
                    ${(checkoutMutation.isPending || isCurrentPlan || isLowerPlan) ? 'opacity-70 cursor-not-allowed' : ''}
                  `}
                >
                  {checkoutMutation.isPending && checkoutMutation.variables === plan.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isCurrentPlan ? 'Đang sử dụng' : (isLowerPlan ? 'Đã vượt cấp' : (isPremium ? 'Trở thành Premium' : 'Nâng cấp ngay'))}
                      {!isCurrentPlan && !isLowerPlan && <ArrowRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto pt-12 border-t border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8 flex items-center justify-center gap-2">
          <HelpCircle className="text-gray-400" /> Câu hỏi thường gặp
        </h2>
        <div className="grid gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-2">Tôi có thể hủy hoặc đổi gói bất cứ lúc nào không?</h4>
            <p className="text-sm text-gray-600">Có, hệ thống sẽ tự động cập nhật lại thời gian sử dụng khi bạn mua gói mới đè lên gói cũ.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-2">Thanh toán bằng PayOS có an toàn không?</h4>
            <p className="text-sm text-gray-600">PayOS là cổng thanh toán bảo mật, hỗ trợ chuyển khoản ngân hàng nhanh 24/7. Gói sẽ được kích hoạt ngay lập tức sau khi thanh toán thành công.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
