import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import type { AdminRevenueStatsResponse, AdminSubscriptionStatsResponse } from '../../api/admin.api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Package, Users, Store } from 'lucide-react';
import CountUpModule from 'react-countup';
const CountUp = (CountUpModule as any).default || CountUpModule;
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function StatCard({ title, value, isCurrency, icon, trend, className }: { title: string, value: number, isCurrency?: boolean, icon: React.ReactNode, trend?: string, className?: string }) {
  return (
    <div className={cn("bg-mint-canvas border border-mint-hairline rounded-[16px] p-5 shadow-sm flex flex-col justify-between", className)}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-mint-stone text-[13px] font-medium leading-tight">{title}</h3>
        <div className="w-8 h-8 rounded-[10px] bg-mint-surface flex items-center justify-center text-mint-brand-green shrink-0 ml-2">
          {icon}
        </div>
      </div>
      <div className="flex flex-col mt-auto">
        <div className="text-[24px] lg:text-[28px] font-bold text-mint-ink tracking-tight leading-none mb-1">
          <CountUp
            end={value}
            duration={2.5}
            separator="."
            decimal=","
            suffix={isCurrency ? " ₫" : ""}
          />
        </div>
        {trend && (
          <div className="text-[12px] font-medium text-[#1ba673] flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [revenueStats, setRevenueStats] = useState<AdminRevenueStatsResponse | null>(null);
  const [subStats, setSubStats] = useState<AdminSubscriptionStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [revData, subData] = await Promise.all([
          adminApi.getRevenueStats(),
          adminApi.getSubscriptionStats()
        ]);
        setRevenueStats(revData);
        setSubStats(subData);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-8 h-8 border-[3px] border-mint-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const revenueChartData = revenueStats?.monthlyRevenues.map(r => ({
    name: `${r.month}/${r.year}`,
    Revenue: r.revenue
  })) || [];

  const subChartData = subStats?.monthlyStats.map(s => ({
    name: `${s.month}/${s.year}`,
    NewSubscriptions: s.newSubscriptionsCount,
    Revenue: s.revenue
  })) || [];

  const activePlansData = subStats?.activeSubscriptionsByPlan.map(p => ({
    name: p.planName,
    value: p.activeCount
  })) || [];

  const PIE_COLORS = ['#10B981', '#0EA5E9', '#F59E0B', '#8B5CF6', '#EC4899'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.round(amount));
  };

  return (
    <div className="p-6 max-w-[1280px] mx-auto font-inter bg-mint-surface-soft min-h-[calc(100vh-64px)] rounded-tl-[16px] border-t border-l border-mint-hairline shadow-sm flex flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-[28px] font-semibold text-mint-ink tracking-[-0.5px] leading-tight">Tổng quan Bảng điều khiển</h1>
        <p className="text-[14px] text-mint-steel mt-1">Theo dõi doanh thu nền tảng và các chỉ số gói đăng ký.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-4 lg:min-h-[600px] pb-4 lg:pb-0">
        
        {/* Row 1: KPI Stats */}
        <StatCard 
          title="Tổng doanh thu nền tảng" 
          value={(revenueStats?.totalRevenue || 0) + (revenueStats?.totalShopNetRevenue || 0) + (subStats?.totalSubscriptionRevenue || 0)} 
          isCurrency
          icon={<DollarSign className="w-5 h-5" />} 
          trend="Toàn thời gian"
          className="lg:col-span-3 bg-gradient-to-br from-mint-brand-green/5 to-transparent border-mint-brand-green/20"
        />
        <StatCard 
          title="Thu nhập ròng các Cửa hàng" 
          value={revenueStats?.totalShopNetRevenue || 0} 
          isCurrency
          icon={<Store className="w-5 h-5" />} 
          trend="Toàn thời gian"
          className="lg:col-span-3"
        />
        <StatCard 
          title="Doanh thu phí" 
          value={revenueStats?.totalRevenue || 0} 
          isCurrency
          icon={<TrendingUp className="w-4 h-4" />} 
          trend="Toàn thời gian"
          className="lg:col-span-2"
        />
        <StatCard 
          title="DT Gói ĐK" 
          value={subStats?.totalSubscriptionRevenue || 0} 
          isCurrency
          icon={<Package className="w-5 h-5" />} 
          trend="Toàn thời gian"
          className="lg:col-span-2"
        />
        <StatCard 
          title="Gói ĐK Active" 
          value={subStats?.totalActiveSubscriptions || 0} 
          icon={<Users className="w-4 h-4" />} 
          trend="Hiện tại"
          className="lg:col-span-2"
        />

        {/* Row 2 & 3: Main Chart */}
        <div className="lg:col-span-8 lg:row-span-2 bg-mint-canvas border border-mint-hairline rounded-[16px] p-5 shadow-sm flex flex-col h-[300px] lg:h-full">
          <h3 className="text-[15px] font-semibold text-mint-ink mb-4 shrink-0">Doanh thu phí (Hàng tháng)</h3>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  tickFormatter={(val) => formatCurrency(val)}
                />
                <RechartsTooltip 
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Doanh thu phí']}
                />
                <Bar dataKey="Revenue" fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Secondary Chart 1 */}
        <div className="lg:col-span-4 lg:row-span-1 bg-mint-canvas border border-mint-hairline rounded-[16px] p-5 shadow-sm flex flex-col h-[280px] lg:h-full">
          <h3 className="text-[15px] font-semibold text-mint-ink mb-4 shrink-0">Gói ĐK Mới (Hàng tháng)</h3>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={subChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12 }}
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [value, 'Cửa hàng mới']}
                />
                <Line 
                  type="monotone" 
                  dataKey="NewSubscriptions" 
                  name="Cửa hàng mới"
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 3: Secondary Chart 2 */}
        <div className="lg:col-span-4 lg:row-span-1 bg-mint-canvas border border-mint-hairline rounded-[16px] p-5 shadow-sm flex flex-col h-[280px] lg:h-full">
          <h3 className="text-[15px] font-semibold text-mint-ink mb-4 shrink-0">Gói ĐK đang hoạt động theo Gói</h3>
          <div className="flex-1 min-h-0 w-full flex items-center justify-center">
            {activePlansData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activePlansData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {activePlansData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-mint-stone text-[14px]">Không tìm thấy gói đăng ký nào đang hoạt động</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
