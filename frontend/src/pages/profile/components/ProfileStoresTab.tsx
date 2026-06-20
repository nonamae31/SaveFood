import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Store, Clock, XCircle, CheckCircle } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { storeApi } from '@/api/store.api';
import dayjs from 'dayjs';

export function ProfileStoresTab() {
  const navigate = useNavigate();

  const { data: myRegistrations, isLoading } = useQuery({
    queryKey: ['myStoreRegistrations'],
    queryFn: storeApi.getMyRegistrations
  });

  return (
    <div className="bg-white shadow-[--shadow-card] rounded-2xl overflow-hidden" data-testid="profile-stores-tab">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Store className="text-brand-600" /> Cửa hàng của tôi
          </h2>
          <button 
            onClick={() => navigate(ROUTES.STORE_REGISTER)}
            className="px-5 py-2 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors text-sm w-full sm:w-auto text-center shadow-sm"
          >
            + Đăng ký mới
          </button>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-xl border border-gray-100">Đang tải...</div>
        ) : !myRegistrations || myRegistrations.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center">
            <Store className="text-gray-300 w-12 h-12 mb-3" />
            <p className="text-gray-500 mb-1 font-medium">Bạn chưa đăng ký cửa hàng nào.</p>
            <p className="text-gray-400 text-sm">Hãy đăng ký để bắt đầu bán hàng giải cứu nhé!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myRegistrations.map((reg) => (
              <div key={reg.id} className="border border-gray-100 rounded-xl p-5 sm:p-6 hover:shadow-md transition-shadow bg-white">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{reg.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{reg.detailedAddress}</p>
                  </div>
                  <div className="shrink-0">
                    {reg.status === 0 && <span className="inline-flex items-center gap-1.5 text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"><Clock size={14} /> Chờ duyệt</span>}
                    {reg.status === 1 && <span className="inline-flex items-center gap-1.5 text-green-600 bg-green-50 border border-green-100 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"><CheckCircle size={14} /> Đã duyệt</span>}
                    {reg.status === 2 && <span className="inline-flex items-center gap-1.5 text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"><XCircle size={14} /> Bị từ chối</span>}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                  <span className="text-xs text-gray-400">Ngày đăng ký: {dayjs(reg.createdAt).format('DD/MM/YYYY')}</span>
                  {reg.status === 1 && (
                    <button 
                      onClick={() => window.location.href = ROUTES.DASHBOARD_STORES(reg.id)}
                      className="text-sm text-brand-600 font-bold hover:text-brand-700 bg-brand-50 px-4 py-1.5 rounded-lg transition-colors"
                    >
                      Vào Dashboard &rarr;
                    </button>
                  )}
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
