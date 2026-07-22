import React, { useEffect, useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  ClipboardList, CheckCircle, PackageCheck, Truck,
  XCircle, ChevronRight, Loader2, RefreshCw, X, User,
  Banknote, CreditCard, Hash, Package, Wallet
} from 'lucide-react';
import { storeOrdersApi } from '@/api/store.orders.api';
import type { StoreOrderDTO } from '@/api/store.orders.api';
import toast from 'react-hot-toast';
import { HubConnectionBuilder } from '@microsoft/signalr';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<number, { label: string; color: string; bg: string; dot: string }> = {
  0: { label: 'Chờ xác nhận', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  1: { label: 'Đã xác nhận', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  2: { label: 'Chờ lấy hàng', color: 'text-purple-700', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  3: { label: 'Hoàn thành', color: 'text-green-700', bg: 'bg-green-50', dot: 'bg-green-500' },
  4: { label: 'Đã hủy', color: 'text-gray-500', bg: 'bg-gray-50', dot: 'bg-gray-400' },
  5: { label: 'Chờ khách xác nhận', color: 'text-orange-700', bg: 'bg-orange-50', dot: 'bg-orange-500' },
};

const PAYMENT_METHOD: Record<number, { label: string; icon: any; color: string }> = {
  0: { label: 'Ví SaveFood', icon: Wallet, color: 'text-brand-700 bg-brand-50' },
  1: { label: 'PayOS', icon: CreditCard, color: 'text-indigo-700 bg-indigo-50' },
};

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: '0', label: 'Chờ xác nhận' },
  { key: '1', label: 'Đã xác nhận' },
  { key: '2', label: 'Chờ lấy hàng' },
  { key: '3', label: 'Hoàn thành' },
  { key: '4', label: 'Đã hủy' },
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.round(n));

function ActionButton({
  icon, label, colorClass, loading, onClick,
}: {
  icon: React.ReactNode; label: string; colorClass: string; loading: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorClass} flex-1`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}

function StoreConfirmButton({
  order, storeId, loading, act
}: {
  order: StoreOrderDTO, storeId: string, loading: string | null, act: (fn: () => Promise<any>, actionName: string) => Promise<void>
}) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calc = () => {
      const createdTime = new Date(order.createdAt).getTime();
      const waitTime = 10 * 1000;
      const targetTime = createdTime + waitTime;
      const now = new Date().getTime();
      return Math.max(0, Math.floor((targetTime - now) / 1000));
    };

    setTimeLeft(calc());
    const interval = setInterval(() => {
      const t = calc();
      setTimeLeft(t);
      if (t === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [order.createdAt]);

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`;
  const isDisabled = timeLeft > 0;

  return (
    <div className="flex-1 flex flex-col items-center">
      <button
        onClick={() => act(() => storeOrdersApi.confirm(storeId, order.id), 'Xác nhận đơn')}
        disabled={loading === 'Xác nhận đơn' || isDisabled}
        className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDisabled ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {loading === 'Xác nhận đơn' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
        {isDisabled ? `Chờ xác nhận (${timeStr})` : 'Xác nhận đơn'}
      </button>
      {isDisabled && (
        <span className="text-[10px] text-gray-500 mt-1.5 font-medium">
          Có thể xác nhận sau: {timeStr}
        </span>
      )}
    </div>
  );
}

// ─── Order Detail Modal ────────────────────────────────────────────────────────
function OrderDetailModal({
  order, storeId, onClose, onRefresh
}: {
  order: StoreOrderDTO; storeId: string; onClose: () => void; onRefresh: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const cfg = STATUS_CONFIG[order.orderStatus] ?? STATUS_CONFIG[4];

  const payInfo = order.paymentMethod !== null && order.paymentMethod !== undefined
    ? PAYMENT_METHOD[order.paymentMethod]
    : null;
  const PayIcon = payInfo?.icon ?? Banknote;
  const isPaid = order.paymentStatus === 1;

  const act = async (action: () => Promise<void>, label: string) => {
    setLoading(label);
    try {
      await action();
      toast.success(`${label} thành công!`);
      onRefresh();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Có lỗi xảy ra.';
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div className="bg-white shadow-2xl w-full max-w-md h-full overflow-hidden flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Chi tiết đơn hàng</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
              {order.pickupCode && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs font-mono font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">Mã: {order.pickupCode}</span>
                </>
              )}
            </div>
            {order.expectedPickupTime && (
              <div className="mt-1">
                <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded">
                  Giờ lấy hàng: {formatDate(order.expectedPickupTime)}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Payment */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.color}`}>
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <div className="flex items-center gap-2">

              <span className={`text-xs font-medium px-2 py-1 rounded-md ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </div>
          </div>

          {/* Customer */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Thông tin khách hàng</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                <User size={18} className="text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{order.customerName}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Sản phẩm</h4>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                      <Package size={14} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.productName}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.unitPrice)} × {item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200 pt-4 flex items-center justify-between">
            <span className="font-semibold text-gray-700">Tổng cộng</span>
            <span className="text-xl font-bold text-brand-600">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        {/* Footer Actions */}
        {order.orderStatus !== 3 && order.orderStatus !== 4 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-3">
            {order.orderStatus === 0 && (
              <>
                <ActionButton
                  icon={<XCircle size={16} />}
                  label="Từ chối"
                  colorClass="bg-red-500 hover:bg-red-600"
                  loading={loading === 'Từ chối'}
                  onClick={() => act(() => storeOrdersApi.cancel(storeId, order.id), 'Từ chối')}
                />
                <StoreConfirmButton 
                  order={order} 
                  storeId={storeId} 
                  loading={loading} 
                  act={act} 
                />
              </>
            )}
            {order.orderStatus === 1 && (
              <ActionButton
                icon={<PackageCheck size={16} />}
                label="Đã chuẩn bị xong"
                colorClass="bg-purple-600 hover:bg-purple-700"
                loading={loading === 'Đã chuẩn bị xong'}
                onClick={() => act(() => storeOrdersApi.markReady(storeId, order.id), 'Đã chuẩn bị xong')}
              />
            )}
            {order.orderStatus === 2 && (
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 text-gray-500 text-sm font-medium border border-dashed border-gray-300 w-full">
                <Truck size={16} />
                Quét QR tại quầy để xác nhận khách nhận hàng
              </div>
            )}
            {order.orderStatus === 5 && (
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-50 text-orange-700 text-sm font-medium border border-orange-200 w-full">
                <Truck size={16} />
                Đang chờ khách xác nhận nhận hàng
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Order Row ─────────────────────────────────────────────────────────────────
function OrderRow({
  order, onClick, isSelected, onToggleSelect
}: {
  order: StoreOrderDTO; onClick: () => void; isSelected?: boolean; onToggleSelect?: (e: React.MouseEvent) => void;
}) {
  const cfg = STATUS_CONFIG[order.orderStatus] ?? STATUS_CONFIG[4];

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:border-brand-300 hover:shadow-md cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 p-4">
        {onToggleSelect && (
          <input 
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            onClick={onToggleSelect}
            className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
          />
        )}
        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} flex-shrink-0`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>

        {/* Customer */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{order.customerName}</p>
          <p className="text-xs text-gray-400 truncate">{order.items?.length || 0} sản phẩm</p>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-gray-900 text-sm">{formatCurrency(order.totalAmount)}</p>
          <p className="text-xs text-gray-400">
            {order.expectedPickupTime ? `Lấy lúc: ${formatDate(order.expectedPickupTime)}` : formatDate(order.createdAt)}
          </p>
        </div>

        {/* Expand icon */}
        <span className="text-gray-300 flex-shrink-0 ml-1 group-hover:text-brand-500 transition-colors">
          <ChevronRight size={18} />
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardOrdersPage() {
  const { user } = useAuthContext();
  const [orders, setOrders] = useState<StoreOrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<StoreOrderDTO | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated && updated.orderStatus !== selectedOrder.orderStatus) {
        setSelectedOrder(updated);
      }
    }
  }, [orders, selectedOrder]);

  const storeId = user?.storeId ?? '';

  const fetchOrders = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    storeOrdersApi.getOrders(storeId)
      .then(data => { if (!cancelled) { setOrders(data); setIsLoading(false); } })
      .catch((e: unknown) => {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Không thể tải đơn hàng.';
          toast.error(msg);
          setIsLoading(false);
        }
      });
      
    const handleStatusUpdate = () => {
      setRefreshKey(k => k + 1);
    };
    window.addEventListener('order-status-updated', handleStatusUpdate);

    return () => { 
      cancelled = true; 
      window.removeEventListener('order-status-updated', handleStatusUpdate);
    };
  }, [storeId, refreshKey]);

  // Lắng nghe sự kiện đơn hàng mới qua SignalR
  useEffect(() => {
    if (!storeId) return;

    // Lấy origin từ VITE_API_BASE_URL hoặc mặc định
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://localhost:7251/api').replace('/api', '');

    const connection = new HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/notifications`, {
        withCredentials: true
      })
      .withAutomaticReconnect()
      .build();

    connection.on('NewOrderReceived', (orderId: string) => {
      setRefreshKey(k => k + 1);
    });

    connection.on('ReceiveNotification', (notif: any) => {
      if (notif.type === 'NEW_ORDER') {
        setRefreshKey(k => k + 1);
      }
    });

    connection.on('OrderStatusUpdated', (orderId: string, status: number) => {
      setRefreshKey(k => k + 1);
    });

    connection.start().catch(console.error);

    return () => {
      connection.stop();
    };
  }, [storeId]);

  const filtered = activeFilter === 'all'
    ? orders
    : orders.filter(o => o.orderStatus === Number(activeFilter));

  const countFor = (key: string) =>
    key === 'all' ? orders.length : orders.filter(o => o.orderStatus === Number(key)).length;

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76,
    overscan: 5,
  });

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(filtered.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const hasSelected = selectedOrderIds.length > 0;
  const isAllSelected = filtered.length > 0 && selectedOrderIds.length === filtered.length;

  const handleBulkAction = async (action: (storeId: string, orderId: string) => Promise<void>, label: string) => {
    try {
      await Promise.all(selectedOrderIds.map(id => action(storeId, id)));
      toast.success(`${label} hàng loạt thành công!`);
      setSelectedOrderIds([]);
      fetchOrders();
    } catch (e: unknown) {
      toast.error(`Có lỗi khi ${label} hàng loạt.`);
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList size={22} className="text-green-600" />
            Quản lý Đơn hàng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Xác nhận đơn hàng và cập nhật trạng thái giao nhận.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map(tab => {
          const count = countFor(tab.key);
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl transition-colors cursor-pointer ${isActive
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm">Đang tải đơn hàng...</p>
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-600 mb-1">Không có đơn hàng nào</h3>
          <p className="text-sm text-gray-400">
            {activeFilter === 'all'
              ? 'Cửa hàng của bạn chưa có đơn hàng nào.'
              : `Không có đơn hàng ở trạng thái "${FILTER_TABS.find(t => t.key === activeFilter)?.label}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bulk action header */}
          {['0', '1'].includes(activeFilter) && (
            <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between sticky top-[72px] z-10 shadow-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm font-semibold text-gray-700">Chọn tất cả</span>
              </label>
              {hasSelected && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 mr-2">Đã chọn {selectedOrderIds.length}</span>
                  {activeFilter === '0' && (
                    <button onClick={() => handleBulkAction(storeOrdersApi.confirm, 'Xác nhận')} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 cursor-pointer">
                      Xác nhận
                    </button>
                  )}
                  {activeFilter === '1' && (
                    <button onClick={() => handleBulkAction(storeOrdersApi.markReady, 'Chuẩn bị xong')} className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 cursor-pointer">
                      Chuẩn bị xong
                    </button>
                  )}
                  {activeFilter === '5' && (
                    <span className="text-xs text-gray-400 italic">Đang chờ khách xác nhận</span>
                  )}
                </div>
              )}
            </div>
          )}

          <div ref={parentRef} className="h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const order = filtered[virtualItem.index];
                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                      paddingBottom: '12px'
                    }}
                  >
                    <OrderRow
                      order={order}
                      onClick={() => setSelectedOrder(order)}
                      isSelected={selectedOrderIds.includes(order.id)}
                      onToggleSelect={['0', '1', '2'].includes(activeFilter) ? (e) => handleToggleSelect(order.id, e) : undefined}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          storeId={storeId}
          onClose={() => setSelectedOrder(null)}
          onRefresh={fetchOrders}
        />
      )}
    </div>
  );
}
