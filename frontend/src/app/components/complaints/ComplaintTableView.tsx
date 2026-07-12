import React from 'react';
import type { ComplaintDto } from '@/types/complaint.types';
import { useNavigate } from 'react-router-dom';

export function ComplaintTableView({ complaints, onSelect, role = 'shop' }: { complaints: ComplaintDto[], onSelect: (id: string) => void, role?: 'shop' | 'admin' }) {
  const getStatusDisplay = (status: any) => {
    if (status === 'Pending' || status === 0) return { label: 'Chờ xử lý', color: 'bg-red-100 text-red-800' };
    if (status === 'Processing' || status === 1) return { label: 'Đang giải quyết', color: 'bg-yellow-100 text-yellow-800' };
    if (status === 'Resolved' || status === 2) return { label: 'Đã đóng', color: 'bg-green-100 text-green-800' };
    if (status === 'Rejected' || status === 3) return { label: 'Bị từ chối', color: 'bg-gray-100 text-gray-800' };
    return { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {role === 'admin' ? 'Khách Hàng / Cửa Hàng' : 'Mã/KH'}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 cursor-pointer">
          {complaints.map((c) => {
            const statusDisplay = getStatusDisplay(c.status);
            return (
              <tr key={c.id} onClick={() => onSelect(c.id)} className="hover:bg-blue-50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap">
                  {role === 'admin' ? (
                    <>
                      <div className="text-sm font-bold text-gray-900">{c.customerName || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{c.storeName ? `Cửa hàng: ${c.storeName}` : (c.customerEmail || 'N/A')}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-bold text-gray-900">{c.code}</div>
                      <div className="text-xs text-gray-500">{c.customerName}</div>
                    </>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusDisplay.color}`}>
                    {statusDisplay.label}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {c.createdAt}
                </td>
              </tr>
            );
          })}
          {complaints.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-gray-500 text-sm">
                Không có khiếu nại nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
