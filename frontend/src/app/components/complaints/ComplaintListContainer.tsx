import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { TriageInboxLayout } from './TriageInboxLayout';
import { ComplaintTableView } from './ComplaintTableView';
import { ComplaintSkeleton } from './ComplaintSkeleton';
import { NotificationBadge } from './NotificationBadge';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const isComplaintClosed = (status: any) => {
  return status === 2 || status === 'Resolved' || status === 'RESOLVED' || 
         status === 4 || status === 'Cancelled' || status === 'CANCELLED' || 
         status === 'CLOSED';
};

export function ComplaintListContainer({ role }: { role: 'shop' | 'admin' }) {
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaintDetail, setSelectedComplaintDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | null>(null);

  // 🔒 SECURITY DIRECTIVE [ERROR]
  // Áp dụng cho: fetchComplaints
  // Ràng buộc: Bắt buộc bọc mọi lời gọi API trong try-catch, dùng error mapping. Không bao giờ hiển thị error.message từ server exception lên UI người dùng.
  useEffect(() => {
    let isMounted = true;
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `/v1/complaints?page=1&size=50${statusFilter !== null ? `&status=${statusFilter}` : ''}`;
        const response = await apiClient<any>(url);
        
        if (isMounted) {
          setComplaints(response.items || []);
        }
      } catch (err: unknown) {
        console.error('[API Error]', err);
        if (isMounted) {
          if (err instanceof Response) {
            const status = err.status;
            const errorMap: Record<number, string> = {
              400: 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.',
              401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
              403: 'Bạn không có quyền thực hiện thao tác này.',
              404: 'Không tìm thấy dữ liệu yêu cầu.',
              429: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
              500: 'Lỗi hệ thống. Chúng tôi đang khắc phục.',
            };
            setError(errorMap[status] ?? 'Đã xảy ra lỗi. Vui lòng thử lại.');
          } else {
            setError('Không thể kết nối. Vui lòng kiểm tra mạng.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchComplaints();
    return () => { isMounted = false; };
  }, [role, statusFilter]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedComplaintDetail(null);
      return;
    }
    let isMounted = true;
    const fetchDetail = async (isBackground = false) => {
      try {
        if (!isBackground) setLoadingDetail(true);
        const detail = await apiClient<any>(`/v1/complaints/${selectedId}`);
        if (isMounted) {
          setSelectedComplaintDetail(detail);
        }
      } catch (err: unknown) {
        console.error('[API Error Detail]', err);
      } finally {
        if (isMounted && !isBackground) {
          setLoadingDetail(false);
        }
      }
    };
    fetchDetail(false);

    // Setup SignalR connection
    const connection = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/hubs/complaint`)
      .configureLogging(LogLevel.Information)
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        await connection.invoke('JoinComplaintGroup', selectedId);
        connection.on('ReceiveMessage', (message) => {
          if (isMounted) {
            setSelectedComplaintDetail((prev: any) => {
              if (!prev) return prev;
              // Check if message already exists
              if (prev.messages && prev.messages.some((m: any) => m.id === message.id)) return prev;
              return {
                ...prev,
                messages: [...(prev.messages || []), message]
              };
            });
          }
        });
        connection.on('ReceiveStatusUpdate', (data) => {
          if (isMounted) {
            setSelectedComplaintDetail((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                status: data.status,
                isStopRequested: data.isStopRequested
              };
            });
            // Also update the list item if possible
            setComplaints((prev) => prev.map(c => c.id === selectedId ? { ...c, status: data.status, isStopRequested: data.isStopRequested } : c));
          }
        });
      } catch (err) {
        console.error('[SignalR Error]', err);
      }
    };

    startConnection();

    return () => { 
      isMounted = false; 
      connection.stop();
    };
  }, [selectedId]);

  const handleReply = async () => {
    if (!selectedId || !replyText.trim()) return;
    try {
      await apiClient<any>(`/v1/complaints/${selectedId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: replyText })
      });
      setReplyText('');
      const detail = await apiClient<any>(`/v1/complaints/${selectedId}`);
      setSelectedComplaintDetail(detail);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestStop = async () => {
    if (!selectedId) return;
    try {
      await apiClient<any>(`/v1/complaints/${selectedId}/stop-request`, {
        method: 'POST'
      });
      const detail = await apiClient<any>(`/v1/complaints/${selectedId}`);
      setSelectedComplaintDetail(detail);
    } catch (err) {
      console.error(err);
    }
  };


  const sidebar = (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-extrabold text-xl tracking-tight text-gray-900">Bộ Lọc ({role === 'shop' ? 'Shop' : 'Admin'})</h2>
        <NotificationBadge />
      </div>
      <ul className="space-y-2 text-sm font-medium">
        <li 
          onClick={() => setStatusFilter(null)}
          className={`p-3 rounded-lg cursor-pointer transition-colors ${statusFilter === null ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
        >
          Tất cả Inbox
        </li>
        <li 
          onClick={() => setStatusFilter(0)}
          className={`p-3 rounded-lg cursor-pointer transition-colors flex justify-between ${statusFilter === 0 ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
        >
          <span>Chờ xử lý</span>
        </li>
        <li 
          onClick={() => setStatusFilter(1)}
          className={`p-3 rounded-lg cursor-pointer transition-colors ${statusFilter === 1 ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
        >
          Đang giải quyết
        </li>
        <li 
          onClick={() => setStatusFilter(2)}
          className={`p-3 rounded-lg cursor-pointer transition-colors ${statusFilter === 2 ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
        >
          Đã đóng
        </li>
      </ul>
    </div>
  );

  const list = (
    <div className="flex-1 flex flex-col h-full overflow-hidden shadow-inner bg-white">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <h2 className="font-bold text-lg text-gray-800">Danh sách Khiếu Nại</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {error ? (
           <div className="p-4 text-red-600 bg-red-50 rounded m-4 border border-red-200 text-sm">{error}</div>
        ) : loading ? (
          <ComplaintSkeleton />
        ) : (
          <ComplaintTableView complaints={complaints} onSelect={setSelectedId} role={role} />
        )}
      </div>
    </div>
  );

  const detail = (
    <div className="p-8 h-full flex flex-col items-center justify-center text-gray-500 relative">
      {selectedComplaintDetail ? (
         // 🔒 SECURITY DIRECTIVE [XSS]
         // Ràng buộc: Ưu tiên React escaping, không dùng dangerouslySetInnerHTML để hiển thị dữ liệu text (detail)
        <div className="w-full h-full text-left bg-white p-8 rounded-xl shadow-sm border border-gray-100 overflow-y-auto">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-full">Đang tải chi tiết...</div>
            ) : (
              <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Khiếu Nại #{selectedComplaintDetail.code || selectedComplaintDetail.id}</h2>
                <p className="text-sm text-gray-500">Bởi: {selectedComplaintDetail.customerName} - {selectedComplaintDetail.createdAt}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {role === 'admin' && selectedComplaintDetail.storeId && (
                    <>
                      <button 
                        onClick={() => window.open(`/admin/approvals?openStoreId=${selectedComplaintDetail.storeId}`, '_blank')}
                        className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 text-xs font-semibold hover:bg-blue-100 transition-colors"
                      >
                        Quản lý Cửa Hàng
                      </button>
                      <button 
                        onClick={() => window.open(`/stores/${selectedComplaintDetail.storeId}`, '_blank')}
                        className="px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                      >
                        Xem Cửa Hàng (Customer View)
                      </button>
                    </>
                  )}
                  {role === 'shop' && (selectedComplaintDetail.listingId || selectedComplaintDetail.productId) && (
                    <button 
                      onClick={() => window.open(`/products/${selectedComplaintDetail.listingId || selectedComplaintDetail.productId}`, '_blank')}
                      className="px-3 py-1.5 rounded-lg border border-purple-200 text-purple-700 bg-purple-50 text-xs font-semibold hover:bg-purple-100 transition-colors"
                    >
                      Mở Sản Phẩm
                    </button>
                  )}
                </div>
              </div>
              <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                  selectedComplaintDetail.status === 'New' || selectedComplaintDetail.status === 0 ? 'bg-red-100 text-red-800' : 
                  selectedComplaintDetail.status === 'Processing' || selectedComplaintDetail.status === 1 ? 'bg-yellow-100 text-yellow-800' : 
                  selectedComplaintDetail.isStopRequested ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {selectedComplaintDetail.isStopRequested ? 'StopRequested' : selectedComplaintDetail.status}
              </span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Nội dung khiếu nại</h3>
              {/* Note: React automatically escapes this text protecting against XSS */}
              <p className="text-gray-800 leading-relaxed font-semibold mb-2">{selectedComplaintDetail.title}</p>
              <p className="text-gray-800 leading-relaxed mb-4">{selectedComplaintDetail.description || selectedComplaintDetail.detail}</p>
              
              {selectedComplaintDetail.evidences && selectedComplaintDetail.evidences.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Hình ảnh / Video đính kèm</h4>
                  <div className="flex flex-wrap gap-4">
                    {selectedComplaintDetail.evidences.map((evidence: any, idx: number) => {
                      const isVideo = evidence.fileType?.toLowerCase().startsWith('video');
                      return (
                        <div key={idx} className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm flex-shrink-0" style={{ width: '120px', height: '120px' }}>
                          {isVideo ? (
                            <video 
                              src={evidence.fileUrl || evidence.url} 
                              controls 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <a href={evidence.fileUrl || evidence.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                              <img 
                                src={evidence.fileUrl || evidence.url} 
                                alt={`Evidence ${idx + 1}`} 
                                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                              />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {selectedComplaintDetail.messages && selectedComplaintDetail.messages.length > 0 && (
              <div className="mb-6 space-y-4">
                <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Tin nhắn ({selectedComplaintDetail.messages.length})</h3>
                {selectedComplaintDetail.messages.map((msg: any, idx: number) => (
                  <div key={idx} className={`p-3 border border-gray-200 rounded-lg shadow-sm ${(msg.senderRole?.toLowerCase() === role || (role === 'shop' && (msg.senderRole?.toLowerCase() === 'shopowner' || msg.senderRole?.toLowerCase() === 'store'))) ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700">
                        {msg.senderName || msg.senderRole} ({(msg.senderRole?.toLowerCase() === 'shop' || msg.senderRole?.toLowerCase() === 'shopowner' || msg.senderRole?.toLowerCase() === 'store') ? 'Store' : msg.senderRole?.toLowerCase() === 'admin' ? 'Admin' : 'Customer'})
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.createdAt.endsWith('Z') ? msg.createdAt : msg.createdAt + 'Z').toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Phản hồi</h3>
              
              {!isComplaintClosed(selectedComplaintDetail.status) ? (
                <>
                  <textarea 
                    className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Nhập nội dung phản hồi cho khách hàng..."
                  ></textarea>
                  
                  <div className="mt-4 flex justify-end gap-3">
                    {selectedComplaintDetail.isStopRequested ? (
                      <button disabled className="px-5 py-2 text-sm font-medium text-amber-700 bg-amber-100 opacity-50 rounded-lg shadow-sm cursor-not-allowed">
                        Đã yêu cầu dừng khiếu nại
                      </button>
                    ) : (
                      <button onClick={handleRequestStop} className="px-5 py-2 text-sm font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors shadow-sm">
                        Yêu cầu dừng khiếu nại
                      </button>
                    )}

                    <button onClick={handleReply} disabled={!replyText.trim()} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
                      Gửi phản hồi
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-gray-100 text-gray-500 text-sm italic rounded-lg text-center">
                  Khiếu nại này đã được giải quyết. Bạn không thể gửi thêm tin nhắn.
                </div>
              )}
            </div>
              </>
            )}
        </div>
      ) : (
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900">Chưa chọn khiếu nại</p>
          <p className="text-sm text-gray-500 mt-1">Vui lòng chọn một khiếu nại từ danh sách bên trái để xem chi tiết</p>
        </div>
      )}
    </div>
  );

  return <TriageInboxLayout sidebar={sidebar} list={list} detail={detail} />;
}
