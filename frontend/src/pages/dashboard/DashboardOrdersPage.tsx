import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  ClipboardList, CheckCircle, PackageCheck, Truck,
  XCircle, ChevronDown, ChevronUp, Loader2, RefreshCw,
} from 'lucide-react';
import { storeOrdersApi } from '@/api/store.orders.api';
import type { StoreOrderDTO } from '@/api/store.orders.api';
import toast from 'react-hot-toast';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<number, { label: string; color: string; bg: string; dot: string }> = {
  0: { label: 'Chờ xác nhận', color: 'text-amber-700', bg: 'bg-amber-50',  dot: 'bg-amber-500'  },
  1: { label: 'Đã xác nhận',  color: 'text-blue-700',  bg: 'bg-blue-50',   dot: 'bg-blue-500'   },
  2: { label: 'Chờ lấy hàng', color: 'text-purple-700',bg: 'bg-purple-50', dot: 'bg-purple-500' },
  3: { label: 'Hoàn thành',   color: 'text-green-700', bg: 'bg-green-50',  dot: 'bg-green-500'  },
  4: { label: 'Đã hủy',       color: 'text-gray-500',  bg: 'bg-gray-50',   dot: 'bg-gray-400'   },
};

const FILTER_TABS = [
  { key: 'all',  label: 'Tất cả' },
  { key: '0',    label: 'Chờ xác nhận' },
  { key: '1',    label: 'Đã xác nhận'  },
  { key: '2',    label: 'Chờ lấy hàng' },
  { key: '3',    label: 'Hoàn thành'   },
  { key: '4',    label: 'Đã hủy'       },
];

// ─── Order Row ─────────────────────────────────────────────────────────────────
function OrderRow({
  order, storeId, onRefresh,
}: {
  order: StoreOrderDTO; storeId: string; onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const cfg = STATUS_CONFIG[order.orderStatus] ?? STATUS_CONFIG[4];

  const act = async (action: () => Promise<void>, label: string) => {
    setLoading(label);
    try {
      await action();
      toast.success(`${label} thành công!`);
      onRefresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Có lỗi xảy ra.';
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all">
      {/* ── Header row ─────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none hover:bg-gray-50/60 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} flex-shrink-0`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>

        {/* Customer */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{order.customerName}</p>
          <p className="text-xs text-gray-400 truncate">{order.customerEmail}</p>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-gray-900 text-sm">{formatCurrency(order.totalAmount)}</p>
          <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
        </div>

        {/* Expand icon */}
        <span className="text-gray-400 flex-shrink-0 ml-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>

      {/* ── Expanded detail ─────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
          {/* Items */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sản phẩm</p>
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  <span className="font-medium">{item.productName}</span>
                  <span className="text-gray-400 ml-1">×{item.quantity}</span>
                </span>
                <span className="text-gray-600">{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          {order.orderStatus !== 3 && order.orderStatus !== 4 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {order.orderStatus === 0 && (
                <>
                  <ActionButton
                    icon={<CheckCircle size={14} />}
                    label="Xác nhận đơn"
                    colorClass="bg-blue-600 hover:bg-blue-700"
                    loading={loading === 'Xác nhận đơn'}
                    onClick={() => act(() => storeOrdersApi.confirm(storeId, order.id), 'Xác nhận đơn')}
                  />
                  <ActionButton
                    icon={<XCircle size={14} />}
                    label="Từ chối / Hủy"
                    colorClass="bg-red-500 hover:bg-red-600"
                    loading={loading === 'Từ chối / Hủy'}
                    onClick={() => act(() => storeOrdersApi.cancel(storeId, order.id), 'Từ chối / Hủy')}
                  />
                </>
              )}
              {order.orderStatus === 1 && (
                <ActionButton
                  icon={<PackageCheck size={14} />}
                  label="Đã chuẩn bị xong"
                  colorClass="bg-purple-600 hover:bg-purple-700"
                  loading={loading === 'Đã chuẩn bị xong'}
                  onClick={() => act(() => storeOrdersApi.markReady(storeId, order.id), 'Đã chuẩn bị xong')}
                />
              )}
              {order.orderStatus === 2 && (
                <ActionButton
                  icon={<Truck size={14} />}
                  label="Khách đã nhận hàng"
                  colorClass="bg-green-600 hover:bg-green-700"
                  loading={loading === 'Khách đã nhận hàng'}
                  onClick={() => act(() => storeOrdersApi.complete(storeId, order.id), 'Khách đã nhận hàng')}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  icon, label, colorClass, loading, onClick,
}: {
  icon: React.ReactNode; label: string; colorClass: string; loading: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorClass}`}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardOrdersPage() {
  const { user } = useAuthContext();
  const [orders, setOrders] = useState<StoreOrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

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
    return () => { cancelled = true; };
  }, [storeId, refreshKey]);

  const filtered = activeFilter === 'all'
    ? orders
    : orders.filter(o => o.orderStatus === Number(activeFilter));

  // Badge counts per tab
  const countFor = (key: string) =>
    key === 'all' ? orders.length : orders.filter(o => o.orderStatus === Number(key)).length;

  return (
    <div className="space-y-6 max-w-4xl">
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
        <button
          onClick={fetchOrders}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Làm mới
        </button>
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl transition-colors ${
                isActive
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
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
      ) : filtered.length === 0 ? (
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
        <div className="space-y-3">
          {filtered.map(order => (
            <OrderRow
              key={order.id}
              order={order}
              storeId={user?.storeId ?? ''}
              onRefresh={fetchOrders}
            />
          ))}
        </div>
      )}
    </div>
  );
}
