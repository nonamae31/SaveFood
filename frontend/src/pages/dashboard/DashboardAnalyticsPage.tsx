import React, { useState } from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign, Download, Lock, BarChart3, PieChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { useAuthContext } from '@/contexts/AuthContext';
import { useStoreAnalytics } from '@/hooks/useStores';
import { BentoAnalyticsSkeleton } from '@/components/ui/BentoAnalyticsSkeleton';

export default function DashboardAnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const storeId = user?.storeId ?? '';

  const [days, setDays] = useState(7);
  const { data: analytics, isLoading } = useStoreAnalytics(storeId, days);

  const analyticsLevel = analytics?.analyticsLevel ?? 0;
  const planName = analytics?.planName ?? 'Free';

  const handleExport = async () => {
    if (!analytics) return;

    try {
      const token = localStorage.getItem('sf_access_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5101/api';
      
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(toDate.getDate() - days);

      const url = `${baseUrl}/stores/${storeId}/orders/export-csv?from=${fromDate.toISOString()}&to=${toDate.toISOString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `BaoCao_DonHang_${days}ngay.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Lỗi xuất báo cáo:", error);
      alert("Đã xảy ra lỗi khi xuất báo cáo.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-100 rounded-full w-64 animate-pulse" />
        <BentoAnalyticsSkeleton analyticsLevel={analyticsLevel} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thống kê Doanh thu</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hiệu suất kinh doanh của cửa hàng.
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              Gói {planName}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.DASHBOARD_SUBSCRIPTION)}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors font-medium shadow-sm"
          >
            Quản lý gói
          </button>

          {analyticsLevel >= 2 ? (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              Xuất báo cáo chi tiết
            </button>
          ) : (
            <div className="group relative">
              <button disabled className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl font-medium cursor-not-allowed">
                <Lock className="w-4 h-4" />
                Xuất báo cáo chi tiết
              </button>
              <div className="absolute hidden group-hover:block w-48 bg-gray-900 text-white text-xs rounded py-1 px-2 -bottom-8 left-1/2 -translate-x-1/2 text-center z-10">
                Dành cho gói Premium
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bento Grid Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto">
        {/* ── TOTAL REVENUE: 1x1 ── */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
            {analytics && (
              <span className={`text-xs font-medium px-2 py-1 rounded-lg ${analytics.revenuePercentageChange >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                {analytics.revenuePercentageChange >= 0 ? '+' : ''}{analytics.revenuePercentageChange}%
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-500">Tổng doanh thu</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">
            {analytics ? analytics.totalRevenue.toLocaleString() : 0}đ
          </h3>
        </div>

        {/* ── COMPLETED ORDERS: 1x1 ── */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            {analytics && (
              <span className={`text-xs font-medium px-2 py-1 rounded-lg ${analytics.ordersPercentageChange >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                {analytics.ordersPercentageChange >= 0 ? '+' : ''}{analytics.ordersPercentageChange}%
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-500">Đơn hàng hoàn tất</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">
            {analytics ? analytics.completedOrders.toLocaleString() : 0}
          </h3>
        </div>

        {/* ── RETURN CUSTOMER RATE (Premium): 1x1 ── */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
          {analyticsLevel >= 2 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">Tỉ lệ khách quay lại</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{analytics?.returnCustomerRate ?? 0}%</h3>
            </>
          ) : (
            <div
              className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center backdrop-blur-sm z-10 border border-dashed border-gray-200 cursor-pointer group-hover:bg-gray-100 transition-colors"
              onClick={() => navigate(ROUTES.DASHBOARD_SUBSCRIPTION)}
            >
              <Lock className="w-5 h-5 text-gray-400 mb-1" />
              <p className="text-xs font-medium text-gray-500">Nâng cấp Premium</p>
            </div>
          )}
        </div>

        {/* ── REVENUE CHART (Plus+): 2x2 ── */}
        <div className="md:col-span-2 md:row-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative min-h-[320px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" /> Doanh thu theo tuần
            </h3>
            {analyticsLevel >= 1 && (
              <select
                className="text-sm border-gray-200 rounded-lg"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                <option value={7}>7 ngày qua</option>
                <option value={30}>30 ngày qua</option>
              </select>
            )}
          </div>

          <div className="flex-1 flex flex-col">
            {analyticsLevel >= 1 ? (
              analytics?.weeklyRevenue && analytics.weeklyRevenue.length > 0 ? (
                <div className={`flex-1 ${days === 30 ? 'overflow-x-auto pb-2' : ''}`}>
                  <div className={`flex flex-col h-full justify-end pt-8 ${days === 30 ? 'w-[800px]' : 'w-full'}`}>
                    <div className="flex items-end justify-between gap-2 h-full w-full">
                      {(() => {
                        const maxRev = Math.max(...analytics.weeklyRevenue, 1);
                        return analytics.weeklyRevenue.map((rev, i) => {
                          const h = (rev / maxRev) * 100;
                          return (
                            <div key={i} className="w-full h-full bg-transparent rounded-t-md relative group flex flex-col justify-end">
                              <div className="w-full bg-green-500 rounded-t-md transition-all duration-500 hover:bg-green-400" style={{ height: `${h}%` }}></div>
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                {rev.toLocaleString()}đ
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div className="flex justify-between gap-2 mt-2 w-full">
                      {Array.from({ length: days }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - ((days - 1) - i));
                        return (
                          <div key={i} className={`flex-1 text-center text-gray-500 font-medium ${days === 30 ? 'text-[10px]' : 'text-xs'}`}>
                            {d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Chưa có dữ liệu giao dịch trong {days} ngày qua.</div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/80 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                  <Lock className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="font-bold text-gray-800 mb-1">Biểu đồ Doanh Thu</h4>
                <p className="text-sm text-gray-500 mb-4 max-w-sm text-center">Nâng cấp lên gói Plus hoặc Premium để xem biểu đồ doanh thu và phân tích xu hướng.</p>
                <button
                  onClick={() => navigate(ROUTES.DASHBOARD_SUBSCRIPTION)}
                  className="px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
                >
                  Tìm hiểu thêm
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── TOP PRODUCTS (Plus+): 1x2 ── */}
        <div className="md:col-span-1 md:row-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative min-h-[320px] flex flex-col">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-gray-400" /> Sản phẩm bán chạy
          </h3>

          <div className="flex-1">
            {analyticsLevel >= 1 ? (
              analytics?.topSellingProducts && analytics.topSellingProducts.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topSellingProducts.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                          #{i + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{item.sales}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400 text-center py-4">Chưa có dữ liệu sản phẩm.</div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 bg-gray-50/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm rounded-2xl m-2 border-2 border-dashed border-gray-200">
              <Lock className="w-6 h-6 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-600 mb-3">Tính năng Plus/Premium</p>
              <button
                onClick={() => navigate(ROUTES.DASHBOARD_SUBSCRIPTION)}
                className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
              >
                Nâng cấp
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ADDITIONAL PLUS & PREMIUM FEATURES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Sentiment Analysis (PREMIUM) */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative min-h-[250px]">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
             Đánh giá của khách hàng (Sentiment)
          </h3>
          
          {subscription.analyticsLevel >= 2 ? (
            <div className="space-y-4">
              {analytics ? (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Tích cực (Positive)</span>
                    <span className="font-medium text-green-600">{analytics.positiveReviews}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.max(1, (analytics.positiveReviews / Math.max(1, analytics.positiveReviews + analytics.neutralReviews + analytics.negativeReviews)) * 100)}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center text-sm mt-4">
                    <span className="text-gray-600">Trung tính (Neutral)</span>
                    <span className="font-medium text-gray-600">{analytics.neutralReviews}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${Math.max(1, (analytics.neutralReviews / Math.max(1, analytics.positiveReviews + analytics.neutralReviews + analytics.negativeReviews)) * 100)}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center text-sm mt-4">
                    <span className="text-gray-600">Tiêu cực (Negative)</span>
                    <span className="font-medium text-red-600">{analytics.negativeReviews}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.max(1, (analytics.negativeReviews / Math.max(1, analytics.positiveReviews + analytics.neutralReviews + analytics.negativeReviews)) * 100)}%` }}></div>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="absolute inset-0 bg-gray-50/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm rounded-2xl m-2 border-2 border-dashed border-gray-200">
              <Lock className="w-6 h-6 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-600 mb-3">Tính năng Premium (AI Sentiment)</p>
              <button
                onClick={() => navigate(ROUTES.DASHBOARD_SUBSCRIPTION)}
                className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
              >
                Nâng cấp Premium
              </button>
            </div>
          )}
        </div>

        {/* Khách hàng quay lại (PREMIUM) & Huỷ đơn (PLUS) */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative min-h-[250px] flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
               Phân tích khách hàng
            </h3>
            {subscription.analyticsLevel >= 2 ? (
              <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl border border-orange-100 mb-4">
                <div>
                  <p className="text-xs text-orange-800 font-medium mb-1">Khách quay lại</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics?.returningCustomers ?? 0} / {analytics?.totalCustomers ?? 0}</p>
                </div>
                <Users className="w-8 h-8 text-orange-300" />
              </div>
            ) : (
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 mb-4 opacity-60">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Khách quay lại <Lock className="inline w-3 h-3 ml-1" /></p>
                  <p className="text-xl font-bold text-gray-400">---</p>
                </div>
              </div>
            )}
            
            {subscription.analyticsLevel >= 1 ? (
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100">
                <div>
                  <p className="text-xs text-red-800 font-medium mb-1">Đơn bị huỷ</p>
                  <p className="text-2xl font-bold text-red-600">{analytics?.cancelledOrders ?? 0}</p>
                </div>
                <span className="text-red-300 font-bold text-2xl">✕</span>
              </div>
            ) : (
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 opacity-60">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Đơn bị huỷ <Lock className="inline w-3 h-3 ml-1" /></p>
                  <p className="text-xl font-bold text-gray-400">---</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
