'use client';

import React, { useState, useOptimistic, useRef, useEffect, useTransition } from 'react';
import { Send, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getDisplayError } from '@/utils/apiErrorHandler';
import { apiClient } from '@/lib/apiClient';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

// Types (should normally be imported from types folder)
export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  role: 'customer' | 'shop' | 'admin';
  text: string;
  createdAt: string;
  isSending?: boolean;
  isError?: boolean;
};

export type EvidenceItem = {
  id?: string;
  fileUrl: string;
  fileType: string;
};

export type ComplaintDetail = {
  id: string;
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | string;
  description: string;
  createdAt: string;
  isStopRequested?: boolean;
  stopRequestedByRole?: string;
  evidences?: EvidenceItem[];
  storeId?: string;
  StoreId?: string;
  productId?: string;
  ProductId?: string;
  listingId?: string;
  ListingId?: string;
};

import { useParams, useNavigate } from 'react-router-dom';

const isComplaintClosed = (status: any) => {
  return status === 2 || status === 'Resolved' || status === 'RESOLVED' || 
         status === 4 || status === 'Cancelled' || status === 'CANCELLED' || 
         status === 'CLOSED';
};

export default function ComplaintChatPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistic UI for messages
  const [optimisticMessages, addOptimisticMessage] = useOptimistic<Message[], Message>(
    messages,
    (state, newMessage) => {
      if (state.some(m => m.text === newMessage.text && m.role === newMessage.role && !m.isSending)) {
        return state;
      }
      return [...state, newMessage];
    }
  );

  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch initial data & Polling every 2500ms
  useEffect(() => {
    let isMounted = true;

    const fetchComplaintData = async (silent = false) => {
      try {
        if (!silent) setIsLoading(true);
        const response = await apiClient<any>(`/v1/complaints/${params.id}`);

        if (isMounted && response) {
          const normalizedEvidences: EvidenceItem[] = Array.isArray(response.evidences)
            ? response.evidences.map((ev: any) => ({
                id: ev.id || String(Math.random()),
                fileUrl: ev.fileUrl || ev.url || '',
                fileType: ev.fileType || ev.type || ''
              }))
            : [];

          setComplaint({
            id: response.id,
            title: response.title,
            status: response.status,
            description: response.description,
            createdAt: response.createdAt,
            isStopRequested: Boolean(response.isStopRequested),
            stopRequestedByRole: response.stopRequestedByRole || undefined,
            evidences: normalizedEvidences,
            storeId: response.storeId,
            StoreId: response.StoreId,
            productId: response.productId,
            ProductId: response.ProductId,
            listingId: response.listingId,
            ListingId: response.ListingId
          });

          if (response.messages && Array.isArray(response.messages)) {
            setMessages(
              response.messages.map((msg: any) => ({
                id: msg.id,
                senderId: msg.senderId,
                senderName: msg.senderName || msg.senderRole,
                role: (msg.senderRole?.toLowerCase() || 'customer') as 'customer' | 'shop' | 'admin',
                text: msg.content,
                createdAt: msg.createdAt
              }))
            );
          } else {
            setMessages([]);
          }
        }
      } catch (err) {
        if (!silent && isMounted) setError(getDisplayError(err));
      } finally {
        if (!silent && isMounted) setIsLoading(false);
      }
    };

    fetchComplaintData(false);

    const connection = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/hubs/complaint`)
      .configureLogging(LogLevel.Information)
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        await connection.invoke('JoinComplaintGroup', params.id);
        connection.on('ReceiveMessage', (message) => {
          if (isMounted) {
            setMessages((prev) => {
              // Check if message already exists
              if (prev.some((m) => m.id === message.id || (m.text === message.content && m.isSending))) {
                  return prev.map(m => m.text === message.content && m.isSending ? {
                      ...m,
                      id: message.id,
                      isSending: false
                  } : m);
              }
              
              const newMsg: Message = {
                id: message.id,
                senderId: message.senderId,
                senderName: message.senderName || message.senderRole,
                role: (message.senderRole?.toLowerCase() || 'customer') as 'customer' | 'shop' | 'admin',
                text: message.content,
                createdAt: message.createdAt
              };
              return [...prev, newMsg];
            });
          }
        });

        connection.on('ReceiveStatusUpdate', (data) => {
          if (isMounted) {
            setComplaint((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                status: data.status || data.Status,
                isStopRequested: data.isStopRequested ?? data.IsStopRequested
              };
            });
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
  }, [params.id]);

  const handleConfirmStop = async () => {
    try {
      setIsActionLoading(true);
      try {
        await apiClient(`/v1/complaints/${params.id}/confirm-stop`, { method: 'PATCH' });
      } catch (patchErr: any) {
        if (patchErr?.status === 404 || patchErr?.status === 405) {
          await apiClient(`/v1/complaints/${params.id}/confirm-stop`, { method: 'POST' });
        } else {
          throw patchErr;
        }
      }
      toast.success('Đã đồng ý dừng khiếu nại');
      setComplaint((prev) => (prev ? { ...prev, isStopRequested: false, status: 2 } : prev));
    } catch (err) {
      toast.error(getDisplayError(err));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectStop = async () => {
    try {
      setIsActionLoading(true);
      try {
        await apiClient(`/v1/complaints/${params.id}/reject-stop`, { method: 'PATCH' });
      } catch (patchErr: any) {
        if (patchErr?.status === 404 || patchErr?.status === 405) {
          await apiClient(`/v1/complaints/${params.id}/reject-stop`, { method: 'POST' });
        } else {
          throw patchErr;
        }
      }
      toast.success('Đã từ chối yêu cầu dừng khiếu nại');
      setComplaint((prev) => (prev ? { ...prev, isStopRequested: false } : prev));
    } catch (err) {
      toast.error(getDisplayError(err));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStopComplaint = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn đóng khiếu nại này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      setIsActionLoading(true);
      await apiClient(`/v1/complaints/${params.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 2, note: "Khách hàng chủ động đóng khiếu nại" })
      });
      toast.success('Đã dừng khiếu nại thành công');
      setComplaint((prev) => (prev ? { ...prev, status: 2, isStopRequested: false } : prev));
    } catch (err) {
      toast.error(getDisplayError(err));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSendMessage = async (formData: FormData) => {
    const text = formData.get('message') as string;
    if (!text || !text.trim()) return;
    
    const tempId = `temp-${Date.now()}`;
    const newMsg: Message = {
      id: tempId,
      senderId: 'user-1',
      senderName: 'Bạn',
      role: 'customer',
      text: text.trim(), // Directive 1: Anti-XSS. React will safely escape this text payload. No dangerouslySetInnerHTML.
      createdAt: new Date().toISOString(),
      isSending: true
    };

    formRef.current?.reset();

    startTransition(async () => {
      addOptimisticMessage(newMsg);
      
      try {
        await apiClient<any>(`/v1/complaints/${params.id}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content: newMsg.text })
        });
        
        // We rely entirely on SignalR to append the confirmed message
        // to prevent double messages.
      } catch (err) {
        // Directive 4: mapping error 
        const errorMessage = getDisplayError(err);
        console.error(errorMessage);
        setMessages(prev => [...prev, { ...newMsg, isSending: false, isError: true, text: newMsg.text + '\n(Gửi thất bại)' }]);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <AlertCircle className="mx-auto h-12 w-12 mb-4" />
        <p>{error}</p>
      </div>
    );
  }

  console.log("RENDER COMPLAINT: ", complaint);
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 flex flex-col h-[80vh]">
      {/* Header Info */}
      <div className="bg-white rounded-t-xl border border-gray-200 p-4 shadow-sm z-10">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{complaint?.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Mã khiếu nại: #{complaint?.id ? complaint.id.substring(0, 8) : ''} • Tạo ngày:{' '}
              {complaint?.createdAt ? new Date(complaint.createdAt).toLocaleDateString('vi-VN') : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
            >
              Quay lại
            </button>
            {(complaint?.storeId || complaint?.StoreId) && (
              <button
                onClick={() => window.open(`/stores/${complaint.storeId || complaint.StoreId}`, '_blank')}
                className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 text-sm hover:bg-blue-100 transition-colors"
              >
                Mở Cửa hàng
              </button>
            )}
            {(complaint?.listingId || complaint?.ListingId || complaint?.productId || complaint?.ProductId) && (
              <button
                onClick={() => window.open(`/products/${complaint.listingId || complaint.ListingId || complaint.productId || complaint.ProductId}`, '_blank')}
                className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 text-sm hover:bg-blue-100 transition-colors"
              >
                Mở Sản phẩm
              </button>
            )}
            {!isComplaintClosed(complaint?.status) && (
              <button
                onClick={handleStopComplaint}
                disabled={isActionLoading}
                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                Đóng khiếu nại
              </button>
            )}
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {complaint?.status === 'IN_PROGRESS' ? 'Đang xử lý' : complaint?.status}
            </span>
          </div>
        </div>
      </div>

      {/* Amber Alert Banner when isStopRequested === true */}
      {!isComplaintClosed(complaint?.status) && complaint?.isStopRequested && (
        <div className="bg-amber-50 border-x border-b border-amber-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <span className="text-sm font-medium">
              Shop / Quản trị viên đã gửi yêu cầu dừng khiếu nại này.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmStop}
              disabled={isActionLoading}
              className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              Đồng ý dừng khiếu nại
            </button>
            <button
              type="button"
              onClick={handleRejectStop}
              disabled={isActionLoading}
              className="px-3 py-1.5 bg-gray-200 text-gray-800 text-xs font-medium rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              Từ chối yêu cầu
            </button>
          </div>
        </div>
      )}

      {/* Evidence Gallery */}
      {complaint?.evidences && complaint.evidences.length > 0 && (
        <div className="bg-white border-x border-b border-gray-200 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Minh chứng đính kèm
          </h3>
          <div className="flex flex-wrap gap-3">
            {complaint.evidences.map((ev, idx) => {
              const isVideo =
                ev.fileType?.startsWith('video/') || ev.fileUrl?.match(/\.(mp4|webm|ogg)$/i);
              return (
                <div
                  key={ev.id || idx}
                  className="border rounded-lg overflow-hidden w-24 h-24 bg-gray-100 flex items-center justify-center"
                >
                  {isVideo ? (
                    <video src={ev.fileUrl} controls className="w-full h-full object-cover" />
                  ) : (
                    <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={ev.fileUrl}
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

      {/* Messages List */}
      <div className="flex-1 bg-gray-50 overflow-y-auto p-4 border-x border-gray-200 flex flex-col gap-4">
        {optimisticMessages.map((msg) => {
          const isMe = msg.role === 'customer' || msg.role === 'user';
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-600">
                  {msg.senderName} ({ (msg.role === 'shop' || msg.role === 'store' || msg.role === 'shopowner') ? 'Store' : msg.role === 'admin' ? 'Admin' : 'Customer' })
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(msg.createdAt.endsWith('Z') ? msg.createdAt : msg.createdAt + 'Z').toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div 
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                } ${msg.isSending ? 'opacity-70' : ''} ${msg.isError ? 'bg-red-500 text-white' : ''}`}
              >
                {/* Directive 1: XSS protection applies. Display raw text safely. */}
                <p className="whitespace-pre-wrap break-words text-sm">{msg.text}</p>
              </div>
              {msg.isSending && (
                <span className="text-[10px] text-gray-400 mt-1">Đang gửi...</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Message Input Form */}
      <div className="bg-white p-4 border border-gray-200 rounded-b-xl shadow-sm">
        {!isComplaintClosed(complaint?.status) ? (
          <form ref={formRef} action={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              name="message"
              placeholder="Nhập tin nhắn của bạn..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
              disabled={isPending}
            />
            <button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center w-10 h-10"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-500 italic">Khiếu nại này đã được giải quyết. Bạn không thể gửi thêm tin nhắn.</p>
          </div>
        )}
      </div>
    </div>
  );
}
