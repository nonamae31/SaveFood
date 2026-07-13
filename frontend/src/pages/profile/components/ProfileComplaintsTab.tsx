import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ProfileComplaintsTab() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const response = await apiClient<any>('/v1/complaints?page=1&size=50');
        if (isMounted) {
          setComplaints(response.items || []);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setError('Không thể tải khiếu nại.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchComplaints();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải danh sách khiếu nại...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  const getStatusDisplay = (status: any) => {
    if (status === 'Pending' || status === 0) return { label: 'Chờ xử lý', color: 'bg-red-50 text-red-600 border-red-100' };
    if (status === 'Processing' || status === 1) return { label: 'Đang giải quyết', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' };
    if (status === 'Resolved' || status === 2) return { label: 'Đã đóng', color: 'bg-green-50 text-green-600 border-green-100' };
    if (status === 'Rejected' || status === 3) return { label: 'Bị từ chối', color: 'bg-gray-50 text-gray-600 border-gray-100' };
    return { label: status, color: 'bg-gray-50 text-gray-600 border-gray-100' };
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-xl font-bold font-display text-gray-900">Khiếu nại của tôi</h2>
      </div>
      
      <div className="divide-y divide-gray-100">
        {complaints.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>Bạn chưa gửi khiếu nại nào.</p>
          </div>
        ) : (
          complaints.map((c: any) => {
            const statusDisplay = getStatusDisplay(c.status);
            return (
              <div 
                key={c.id} 
                onClick={() => navigate(`/complaints/${c.id}`)}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900">{c.title || `Khiếu nại #${c.code || c.id}`}</h3>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${statusDisplay.color}`}>
                    {statusDisplay.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{c.description || c.detail}</p>
                <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                  <span className="flex items-center gap-1"><Clock size={14} /> {c.createdAt}</span>
                  {c.storeName && <span>Cửa hàng: {c.storeName}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
