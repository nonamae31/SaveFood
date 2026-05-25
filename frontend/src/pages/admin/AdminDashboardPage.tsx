import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import type { AdminRevenueStatsResponse, AdminSubscriptionStatsResponse } from '../../api/admin.api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend?: string }) {
  return (
    <div className="bg-mint-canvas border border-mint-hairline rounded-[12px] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-mint-stone text-[14px] font-medium">{title}</h3>
        <div className="w-10 h-10 rounded-[8px] bg-mint-surface flex items-center justify-center text-mint-brand-green">
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-3">
        <div className="text-[28px] font-semibold text-mint-ink tracking-tight">{value}</div>
        {trend && (
          <div className="text-[13px] font-medium text-[#1ba673] flex items-center gap-1 mb-1.5">
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
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="p-8 max-w-[1280px] mx-auto font-inter bg-mint-surface-soft min-h-[calc(100vh-64px)] rounded-tl-[16px] border-t border-l border-mint-hairline shadow-sm">
      <div className="mb-8">
        <h1 className="text-[36px] font-semibold text-mint-ink tracking-[-0.5px]">Dashboard Overview</h1>
        <p className="text-[16px] text-mint-steel mt-2">Monitor platform revenue and subscription metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Platform Revenue" 
          value={formatCurrency(revenueStats?.totalRevenue || 0)} 
          icon={<DollarSign className="w-5 h-5" />} 
          trend="Lifetime"
        />
        <StatCard 
          title="Total Sub Revenue" 
          value={formatCurrency(subStats?.totalSubscriptionRevenue || 0)} 
          icon={<Package className="w-5 h-5" />} 
          trend="Lifetime"
        />
        <StatCard 
          title="Active Subscriptions" 
          value={(subStats?.totalActiveSubscriptions || 0).toString()} 
          icon={<Users className="w-5 h-5" />} 
          trend="Current"
        />
        <StatCard 
          title="Avg Revenue/Sub" 
          value={formatCurrency(subStats?.totalActiveSubscriptions ? (subStats.totalSubscriptionRevenue / subStats.totalActiveSubscriptions) : 0)} 
          icon={<TrendingUp className="w-5 h-5" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Revenue Chart */}
        <div className="bg-mint-canvas border border-mint-hairline rounded-[12px] p-6 shadow-sm">
          <h3 className="text-[16px] font-semibold text-mint-ink mb-6">Platform Fee Revenue (Monthly)</h3>
          <div className="h-[300px] w-full">
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
                  tickFormatter={(val) => `₫${val.toLocaleString()}`}
                />
                <RechartsTooltip 
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="Revenue" fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Stats Chart */}
        <div className="bg-mint-canvas border border-mint-hairline rounded-[12px] p-6 shadow-sm">
          <h3 className="text-[16px] font-semibold text-mint-ink mb-6">New Subscriptions (Monthly)</h3>
          <div className="h-[300px] w-full">
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
                />
                <Line 
                  type="monotone" 
                  dataKey="NewSubscriptions" 
                  name="New Stores"
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Subscriptions by Plan Pie Chart */}
        <div className="bg-mint-canvas border border-mint-hairline rounded-[12px] p-6 shadow-sm lg:col-span-2">
          <h3 className="text-[16px] font-semibold text-mint-ink mb-6">Active Subscriptions by Plan</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
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
              <div className="text-mint-stone text-[14px]">No active subscriptions found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
