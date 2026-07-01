import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Store, Clock, XCircle, CheckCircle } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { storeApi } from '@/api/store.api';
import dayjs from 'dayjs';
import { useAuthContext } from '@/contexts/AuthContext';
import { useStoreProfile } from '@/hooks/useStores';

export function ProfileStoresTab() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const { data: myRegistrations, isLoading: isLoadingRegs } = useQuery({
    queryKey: ['myStoreRegistrations'],
    queryFn: storeApi.getMyRegistrations
  });

  const { data: storeProfile, isLoading: isLoadingProfile } = useStoreProfile(user?.storeId || undefined);

  const isLoading = isLoadingRegs || (!!user?.storeId && isLoadingProfile);
  const pendingOrRejectedRegs = myRegistrations?.filter(reg => reg.status !== 1) || [];
  
  const hasPendingRegistration = pendingOrRejectedRegs.some(reg => reg.status === 0);
  const hasActiveStore = !!user?.storeId;
  const canRegister = !hasActiveStore && !hasPendingRegistration;

  const staffRoleText = user?.staffRole === 0 ? 'Chủ cửa hàng' : user?.staffRole === 1 ? 'Quản lý' : user?.staffRole === 2 ? 'Nhân viên' : 'Chủ cửa hàng';

  return (
    <div className="bg-white shadow-[--shadow-card] rounded-2xl overflow-hidden" data-testid="profile-stores-tab">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Store className="text-brand-600" /> Cửa hàng của tôi
          </h2>
          {canRegister && (
            <button 
              onClick={() => navigate(ROUTES.STORE_REGISTER)}
              className="px-5 py-2 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors text-sm w-full sm:w-auto text-center shadow-sm"
            >
              + Đăng ký mới
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-xl border border-gray-100">Đang tải...</div>
        ) : !hasActiveStore && pendingOrRejectedRegs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center">
            <Store className="text-gray-300 w-12 h-12 mb-3" />
            <p className="text-gray-500 mb-1 font-medium">Bạn chưa tham gia hay đăng ký cửa hàng nào.</p>
            <p className="text-gray-400 text-sm">Hãy đăng ký để bắt đầu bán hàng giải cứu nhé!</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Active Store Details */}
            {hasActiveStore && storeProfile && (
              <div className="border-2 border-brand-100 rounded-xl p-5 sm:p-6 hover:shadow-md transition-shadow bg-brand-50/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl z-10">
                  Đang hoạt động
                </div>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden shadow-sm">
                    {storeProfile.logoUrl ? (
                      <img src={storeProfile.logoUrl} alt={storeProfile.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-brand-700">
                        {storeProfile.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900">{storeProfile.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                      <span className="font-semibold bg-white border border-gray-200 px-2 py-0.5 rounded text-xs text-brand-700">{staffRoleText}</span>
                      <span className="truncate max-w-xs sm:max-w-md">{storeProfile.detailedAddress}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4 pt-4 border-t border-brand-100/50">
                  <button 
                    onClick={() => navigate(ROUTES.DASHBOARD)}
                    className="text-sm text-white font-bold bg-brand-600 hover:bg-brand-700 px-5 py-2.5 rounded-xl transition-colors shadow-sm w-full sm:w-auto"
                  >
                    Vào Dashboard &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Pending or Rejected Registrations */}
            {pendingOrRejectedRegs.map((reg) => (
              <div key={reg.id} className="border border-gray-100 rounded-xl p-5 sm:p-6 hover:shadow-md transition-shadow bg-white opacity-80">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{reg.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{reg.detailedAddress}</p>
                  </div>
                  <div className="shrink-0">
                    {reg.status === 0 && <span className="inline-flex items-center gap-1.5 text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"><Clock size={14} /> Chờ duyệt</span>}
                    {reg.status === 2 && <span className="inline-flex items-center gap-1.5 text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"><XCircle size={14} /> Bị từ chối</span>}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                  <span className="text-xs text-gray-400">Ngày đăng ký: {dayjs(reg.createdAt).format('DD/MM/YYYY')}</span>
                </div>
                
                {reg.status === 2 && reg.rejectReason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg flex gap-2">
                    <span className="font-bold shrink-0">Lý do:</span> 
                    <span>{reg.rejectReason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
