import React, { useState } from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign, Download, Lock, BarChart3, PieChart, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { useAuthContext } from '@/contexts/AuthContext';
import { useStoreAnalytics } from '@/hooks/useStores';

export default function DashboardAnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const storeId = user?.storeId || undefined;
  
  const { data: analytics, isLoading } = useStoreAnalytics(storeId);
  
  // MOCK: Replace with real subscription data fetch
  const [subscription] = useState({
    planName: 'Free', // Change to 'Free', 'Plus', 'Premium' to test
    analyticsLevel: 0, // 0 = Free, 1 = Plus, 2 = Premium
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thống kê Doanh thu</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hiệu suất kinh doanh của cửa hàng.
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              Gói {subscription.planName}
            </span>
          </p>
        </div>
        
        {/* PREMIUM FEATURE: Export */}
        {subscription.analyticsLevel >= 2 ? (
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm">
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

      {/* ALL TIERS: Basic Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
          {subscription.analyticsLevel >= 1 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">Tỉ lệ chuyển đổi</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">18.4%</h3>
            </>
          ) : (
            <div 
              className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center backdrop-blur-sm z-10 border border-dashed border-gray-200 cursor-pointer group-hover:bg-gray-100 transition-colors"
              onClick={() => navigate(ROUTES.DASHBOARD_SUBSCRIPTION)}
            >
              <Lock className="w-5 h-5 text-gray-400 mb-1" />
              <p className="text-xs font-medium text-gray-500">Nâng cấp Plus</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
          {subscription.analyticsLevel >= 2 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">Tỉ lệ khách quay lại</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">45%</h3>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PLUS FEATURE: Charts */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative min-h-[300px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" /> Doanh thu theo tuần
            </h3>
            {subscription.analyticsLevel >= 1 && (
              <select className="text-sm border-gray-200 rounded-lg">
                <option>7 ngày qua</option>
                <option>30 ngày qua</option>
              </select>
            )}
          </div>
          
          {subscription.analyticsLevel >= 1 ? (
            <div className="h-48 w-full flex items-end justify-between gap-2 px-4">
              {/* Mock Bar Chart */}
              {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                <div key={i} className="w-full bg-green-100 rounded-t-md relative group">
                  <div className="absolute bottom-0 w-full bg-green-500 rounded-t-md transition-all duration-500 hover:bg-green-400" style={{ height: `${h}%` }}></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 bg-gray-50/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm rounded-2xl m-2 border-2 border-dashed border-gray-200">
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

        {/* PLUS FEATURE: Top Items */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative min-h-[300px]">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-gray-400" /> Sản phẩm bán chạy
          </h3>
          
          {subscription.analyticsLevel >= 1 ? (
            <div className="space-y-4">
              {[
                { name: 'Bánh mì thịt nướng', sales: 45 },
                { name: 'Cà phê sữa đá', sales: 38 },
                { name: 'Túi bất ngờ Bánh ngọt', sales: 24 }
              ].map((item, i) => (
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
    </div>
  );
}
