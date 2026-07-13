import React, { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLogout } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, ClipboardList, User, Shield, Store, LogOut, Gift, AlertCircle } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

import { ProfileInfoTab } from './components/ProfileInfoTab';
import { ProfileStoresTab } from './components/ProfileStoresTab';
import { ProfileSecurityTab } from './components/ProfileSecurityTab';
import { ProfileOrdersTab } from './components/ProfileOrdersTab';
import { ProfileVoucherTab } from './components/ProfileVoucherTab';
import { ProfileComplaintsTab } from './components/ProfileComplaintsTab';

type TabId = 'info' | 'stores' | 'security' | 'orders' | 'voucher' | 'complaints';

export function ProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthContext();
  const logoutMutation = useLogout();
  
  const [activeTab, setActiveTab] = useState<TabId>('info');

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['info', 'stores', 'security', 'orders', 'voucher', 'complaints'].includes(tabParam)) {
      setActiveTab(tabParam as TabId);
    }
  }, [window.location.search]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const TABS = [
    { id: 'info', label: 'Thông tin cá nhân', icon: <User size={18} /> },
    { id: 'stores', label: 'Cửa hàng của tôi', icon: <Store size={18} /> },
    { id: 'security', label: 'Bảo mật', icon: <Shield size={18} /> },
    { id: 'orders', label: 'Đơn mua', icon: <ClipboardList size={18} /> },
    { id: 'voucher', label: 'Voucher', icon: <Gift size={18} /> },
    { id: 'complaints', label: 'Khiếu nại của tôi', icon: <AlertCircle size={18} /> },
  ] as const;

  return (
    <div className="max-w-[--spacing-container] mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-[--color-ink-secondary] hover:text-[--color-brand-600] transition-colors font-medium text-sm mb-4"
          >
            <ArrowLeft size={18} /> Quay lại
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-12 h-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-700 shadow-sm"></div>
            <span className="text-sm font-bold text-brand-700 uppercase tracking-wider">Trang cá nhân</span>
          </div>
          <h1 className="text-3xl font-bold font-[--font-display] text-[--color-ink-primary]">
            Cài đặt <span className="text-[--color-brand-600]">hồ sơ</span>
          </h1>
        </div>
        
        {/* Quick Actions for Desktop & Mobile */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button 
            onClick={() => navigate(ROUTES.MY_WALLET)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-50 text-brand-700 font-bold rounded-xl hover:bg-brand-100 transition-colors text-sm"
          >
            <Wallet size={16} /> Ví
          </button>

          <button 
            onClick={() => logoutMutation.mutate()}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl transition-colors text-sm ml-auto sm:ml-0"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar / Tabs Navigation */}
        <div className="w-full md:w-64 shrink-0">
          {/* Mobile Horizontal Tabs */}
          <div className="md:hidden flex overflow-x-auto hide-scrollbar gap-2 pb-2 mb-2 -mx-4 px-4 snap-x">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  navigate(`/profile?tab=${tab.id}`);
                  setActiveTab(tab.id as TabId);
                }}
                data-testid={`tab-${tab.id}`}
                className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-colors snap-start
                  ${activeTab === tab.id 
                    ? 'bg-brand-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Desktop Vertical Sidebar */}
          <div className="hidden md:flex flex-col gap-2 sticky top-24">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  navigate(`/profile?tab=${tab.id}`);
                  setActiveTab(tab.id as TabId);
                }}
                data-testid={`tab-${tab.id}`}
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all
                  ${activeTab === tab.id 
                    ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                  }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
            
            <div className="mt-8 pt-8 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium px-5 mb-2 uppercase tracking-wider">Hỗ trợ</p>
              <button 
                onClick={() => navigate(ROUTES.HELP_CENTER)}
                className="w-full flex items-center gap-3 px-5 py-3 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors text-left"
              >
                Trung tâm trợ giúp
              </button>
              <button 
                onClick={() => navigate(ROUTES.POLICY)}
                className="w-full flex items-center gap-3 px-5 py-3 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors text-left"
              >
                Điều khoản dịch vụ
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 min-w-0">
          <div className="animate-fade-in">
            {activeTab === 'info' && <ProfileInfoTab />}
            {activeTab === 'stores' && <ProfileStoresTab />}
            {activeTab === 'security' && <ProfileSecurityTab />}
            {activeTab === 'orders' && <ProfileOrdersTab />}
            {activeTab === 'voucher' && <ProfileVoucherTab />}
            {activeTab === 'complaints' && <ProfileComplaintsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
