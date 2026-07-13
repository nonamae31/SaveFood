import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/admin.api';
import type { AdminStoreListDTO, AdminStoreDetailsDTO } from '../../api/admin.api';
import { Building, MapPin, Phone, User, Check, X, Search, ChevronLeft, ChevronRight, ChevronDown, XCircle, Store, CreditCard, Calendar } from 'lucide-react';
import { formatVND } from '../../lib/formatters';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

function CustomSelect({ value, onChange, options, icon }: { value: string, onChange: (val: string) => void, options: {label: string, value: string}[], icon?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || value;
  
  return (
    <div className="relative inline-block text-left">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between min-w-[180px] bg-mint-canvas border border-mint-hairline text-mint-ink text-[14px] rounded-[8px] h-[40px] px-3 focus:outline-none focus:border-mint-brand-green hover:border-mint-steel transition-colors"
      >
        <span className="flex items-center gap-2 truncate">
          {icon}
          {selectedLabel}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-mint-stone transition-transform shrink-0", open ? "rotate-180" : "")} />
      </button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)}></div>
          <div className="absolute z-20 mt-1 w-full bg-mint-canvas border border-mint-hairline rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[14px] transition-colors flex items-center justify-between",
                    value === opt.value ? "bg-mint-surface-soft text-mint-ink font-medium" : "text-mint-steel hover:bg-mint-surface hover:text-mint-ink"
                  )}
                >
                  {opt.label}
                  {value === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-mint-brand-green"></div>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const STORE_STATUS_MAP: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: 'Đang hoạt động', color: 'text-mint-brand-green', bg: 'bg-mint-brand-green/10' },
  1: { label: 'Tạm ngưng', color: 'text-mint-brand-error', bg: 'bg-mint-brand-error/10' },
  2: { label: 'Đã đóng cửa', color: 'text-mint-stone', bg: 'bg-mint-hairline-soft' },
  3: { label: 'Chờ duyệt', color: 'text-[#c37d0d]', bg: 'bg-[#c37d0d]/10' },
  4: { label: 'Từ chối', color: 'text-mint-brand-error', bg: 'bg-red-50' },
};

export default function StoreManagementPage() {
  const [stores, setStores] = useState<AdminStoreListDTO[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const statusOptions = [
    { label: 'Tất cả trạng thái', value: 'All' },
    { label: 'Chờ duyệt', value: '3' },
    { label: 'Đang hoạt động', value: '0' },
    { label: 'Tạm ngưng', value: '1' },
    { label: 'Đã đóng cửa', value: '2' },
    { label: 'Từ chối', value: '4' }
  ];

  // Selected Store Details
  const [selectedStore, setSelectedStore] = useState<AdminStoreDetailsDTO | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  
  // Confirm Modal State
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    newStatus?: number;
    actionType: 'updateStatus' | 'approve';
    message: string;
  } | null>(null);

  const [searchParams] = useSearchParams();

  const fetchStores = () => {
    setLoading(true);
    adminApi.getStores({
      search: search || undefined,
      status: statusFilter,
      pageNumber: page,
      pageSize,
    })
      .then(res => {
        setStores(res.items);
        setTotalCount(res.totalCount);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStores();
  }, [search, statusFilter, page]);

  useEffect(() => {
    const openStoreId = searchParams.get('openStoreId');
    if (openStoreId) {
      viewDetails(openStoreId);
    }
  }, [searchParams]);

  const viewDetails = async (id: string) => {
    setDetailsLoading(true);
    try {
      const data = await adminApi.getStoreDetails(id);
      setSelectedStore(data);
    } catch (e) {
      alert('Lỗi tải chi tiết cửa hàng');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: number, oldStatus: number) => {
    try {
      await adminApi.updateStoreStatus(id, newStatus);
      fetchStores();
      if (selectedStore?.id === id) {
        viewDetails(id);
      }
      
      const actionText = newStatus === 1 ? 'tạm ngưng' : newStatus === 2 ? 'đóng cửa' : 'mở khóa';
      
      toast((t) => (
        <div className="flex items-center gap-4">
          <span>Đã {actionText} cửa hàng.</span>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await adminApi.updateStoreStatus(id, oldStatus);
                fetchStores();
                if (selectedStore?.id === id) viewDetails(id);
                toast.success('Đã hoàn tác thao tác!');
              } catch (e) {
                toast.error('Lỗi khi hoàn tác');
              }
            }}
            className="px-3 py-1.5 text-xs font-bold text-white bg-mint-brand-green rounded-md hover:bg-mint-brand-green/90 transition-colors"
          >
            Hoàn tác
          </button>
        </div>
      ), { duration: 5000, position: 'bottom-center' });

    } catch (e) {
      toast.error('Không thể thực hiện hành động này');
    }
  };

  const handleApprove = async (id: string) => {
    setConfirmAction({
      id,
      actionType: 'approve',
      message: 'Bạn có chắc chắn muốn duyệt cửa hàng này?'
    });
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.actionType === 'updateStatus') {
        await adminApi.updateStoreStatus(confirmAction.id, confirmAction.newStatus!);
      } else if (confirmAction.actionType === 'approve') {
        await adminApi.approveStore(confirmAction.id);
      }
      fetchStores();
      if (selectedStore?.id === confirmAction.id) {
        viewDetails(confirmAction.id);
      }
    } catch (e) {
      alert('Không thể thực hiện hành động này');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!reviewNotes.trim()) {
      alert('Vui lòng cung cấp lý do từ chối.');
      return;
    }
    try {
      await adminApi.rejectStore(id, reviewNotes);
      setRejectingId(null);
      setReviewNotes('');
      fetchStores();
      if (selectedStore?.id === id) viewDetails(id);
    } catch (e) {
      alert('Không thể từ chối cửa hàng');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-8 max-w-[1280px] mx-auto font-inter bg-mint-surface-soft min-h-[calc(100vh-64px)] rounded-tl-[16px] border-t border-l border-mint-hairline shadow-sm">
      
      {/* Main List */}
      <div className="flex flex-col">
        <div className="mb-8">
          <h1 className="text-[36px] font-semibold text-mint-ink tracking-[-0.5px] flex items-center gap-3">
            <Building className="w-8 h-8 text-mint-ink" />
            Quản lý Cửa hàng
          </h1>
          <p className="text-[16px] text-mint-steel mt-2">Xem xét và quản lý tất cả các cửa hàng trên hệ thống.</p>
        </div>

        {/* Filters */}
        <div className="bg-mint-canvas p-4 rounded-[12px] border border-mint-hairline flex flex-wrap gap-4 mb-6 shadow-sm">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-mint-stone" />
            <input
              type="text"
              placeholder="Tìm tên, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-mint-hairline rounded-[8px] text-[14px] focus:outline-none focus:ring-2 focus:ring-mint-primary/20 bg-mint-surface"
            />
          </div>
          <CustomSelect 
            value={statusFilter !== undefined ? statusFilter.toString() : 'All'}
            onChange={(val) => {
              setStatusFilter(val === 'All' ? undefined : Number(val));
              setPage(1);
            }}
            options={statusOptions}
          />
        </div>

        {/* Table */}
        <div className="bg-mint-canvas rounded-[12px] border border-mint-hairline shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-mint-surface text-mint-stone font-medium text-[13px] uppercase tracking-wider border-b border-mint-hairline">
                <tr>
                  <th className="px-6 py-4">Cửa hàng</th>
                  <th className="px-6 py-4">Chủ sở hữu</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Số dư ví</th>
                  <th className="px-6 py-4">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mint-hairline-soft">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-mint-stone">
                      <div className="w-6 h-6 border-[2px] border-mint-brand-green border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : stores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-mint-stone">
                      Không tìm thấy cửa hàng nào
                    </td>
                  </tr>
                ) : (
                  stores.map((store) => (
                    <tr key={store.id} className="hover:bg-mint-surface-soft transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-mint-ink">{store.name}</div>
                        <div className="text-[12px] text-mint-stone truncate max-w-[200px] mt-0.5" title={store.addressLine}>{store.addressLine}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-mint-ink">{store.ownerName || 'N/A'}</div>
                        <div className="text-[12px] text-mint-stone">{store.ownerEmail || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`${STORE_STATUS_MAP[store.status]?.bg} ${STORE_STATUS_MAP[store.status]?.color} text-[11px] font-semibold px-2 py-1 rounded-[6px] uppercase tracking-[0.5px] inline-flex items-center justify-center min-w-[100px]`}>
                          {STORE_STATUS_MAP[store.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-mint-primary">
                        {formatVND(store.availableBalance)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => viewDetails(store.id)}
                          className="text-mint-primary hover:text-mint-primary-hover font-medium bg-mint-primary/10 px-3 py-1.5 rounded-[6px] transition-colors"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-mint-hairline-soft bg-mint-surface/50">
              <span className="text-[13px] text-mint-stone">
                Hiển thị {(page - 1) * pageSize + 1} đến {Math.min(page * pageSize, totalCount)} trên tổng số {totalCount} cửa hàng
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded-[6px] hover:bg-mint-canvas border border-transparent hover:border-mint-hairline text-mint-stone hover:text-mint-ink disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        "w-7 h-7 rounded-[6px] text-[13px] font-medium transition-colors flex items-center justify-center",
                        page === p ? "bg-mint-canvas border border-mint-hairline text-mint-ink shadow-sm" : "text-mint-stone hover:bg-mint-surface hover:text-mint-ink border border-transparent"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1 rounded-[6px] hover:bg-mint-canvas border border-transparent hover:border-mint-hairline text-mint-stone hover:text-mint-ink disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Centered Details Modal */}
      {selectedStore && (
        <div className="fixed inset-0 bg-mint-primary/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-inter">
          <div className="bg-mint-canvas rounded-[16px] border border-mint-hairline shadow-[0_24px_48px_-8px_rgba(0,0,0,0.12)] w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-mint-hairline-soft flex items-start justify-between bg-mint-canvas/80 backdrop-blur-md z-10 shrink-0">
              <div>
                <h2 className="text-[22px] font-semibold text-mint-ink mb-2">{selectedStore.name}</h2>
                <span className={`${STORE_STATUS_MAP[selectedStore.status]?.bg} ${STORE_STATUS_MAP[selectedStore.status]?.color} text-[12px] font-semibold px-2.5 py-1 rounded-[6px] uppercase tracking-[0.5px]`}>
                  {STORE_STATUS_MAP[selectedStore.status]?.label}
                </span>
              </div>
              <button onClick={() => setSelectedStore(null)} className="p-2 hover:bg-mint-surface rounded-full text-mint-stone hover:text-mint-ink transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-8">
            {detailsLoading ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-[3px] border-mint-brand-green border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* Store Actions */}
                <div className="bg-mint-surface-soft p-4 rounded-[12px] border border-mint-hairline-soft">
                  <h3 className="text-[13px] font-semibold text-mint-stone uppercase tracking-wider mb-4">Thao tác</h3>
                  {selectedStore.status === 3 ? (
                    // Pending
                    rejectingId === selectedStore.id ? (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Lý do từ chối..."
                          value={reviewNotes}
                          onChange={e => setReviewNotes(e.target.value)}
                          className="w-full p-3 border border-mint-brand-error rounded-[8px] text-[14px] focus:outline-none min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleReject(selectedStore.id)} className="flex-1 bg-mint-brand-error text-white py-2 rounded-[8px] font-medium text-[14px]">Xác nhận</button>
                          <button onClick={() => setRejectingId(null)} className="px-4 border border-mint-hairline rounded-[8px] text-[14px] font-medium">Hủy</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button onClick={() => handleApprove(selectedStore.id)} className="flex-1 bg-mint-primary hover:bg-mint-charcoal text-white py-2 rounded-[8px] font-medium text-[14px] flex justify-center items-center gap-2">
                          <Check className="w-4 h-4" /> Duyệt
                        </button>
                        <button onClick={() => setRejectingId(selectedStore.id)} className="flex-1 bg-transparent hover:bg-red-50 text-red-600 border border-red-200 py-2 rounded-[8px] font-medium text-[14px] flex justify-center items-center gap-2">
                          <X className="w-4 h-4" /> Từ chối
                        </button>
                      </div>
                    )
                  ) : selectedStore.status === 0 ? (
                    // Active
                    <button onClick={() => handleUpdateStatus(selectedStore.id, 1, selectedStore.status)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-[8px] font-medium text-[14px] flex justify-center items-center gap-2 transition-colors border border-red-200">
                      <XCircle className="w-4 h-4" /> Khóa cửa hàng
                    </button>
                  ) : selectedStore.status === 1 || selectedStore.status === 2 ? (
                    // Suspended / Closed
                    <button onClick={() => handleUpdateStatus(selectedStore.id, 0, selectedStore.status)} className="w-full bg-green-50 hover:bg-green-100 text-green-600 py-2 rounded-[8px] font-medium text-[14px] flex justify-center items-center gap-2 transition-colors border border-green-200">
                      <Check className="w-4 h-4" /> Mở khóa
                    </button>
                  ) : (
                    <div className="text-[14px] text-mint-stone italic">Cửa hàng đã bị từ chối</div>
                  )}
                </div>

                {/* General Info */}
                <div>
                  <h3 className="text-[13px] font-semibold text-mint-stone uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Store className="w-4 h-4" /> Thông tin cửa hàng
                  </h3>
                  <div className="space-y-4 text-[14px]">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-mint-stone shrink-0 mt-0.5" />
                      <span className="text-mint-ink">{selectedStore.addressLine}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-mint-stone shrink-0" />
                      <span className="text-mint-ink">{selectedStore.phoneNumber || 'Không có'}</span>
                    </div>
                    {selectedStore.description && (
                      <div className="text-mint-steel bg-mint-surface p-3 rounded-[8px] mt-2">
                        {selectedStore.description}
                      </div>
                    )}
                    {selectedStore.referenceLink && (
                      <a href={selectedStore.referenceLink} target="_blank" rel="noreferrer" className="text-mint-primary hover:underline text-[13px] font-medium inline-block mt-2">
                        Link tham chiếu (Maps/Fanpage)
                      </a>
                    )}
                    {selectedStore.storefrontImageUrl && (
                      <img src={selectedStore.storefrontImageUrl} alt="Storefront" className="w-full h-[150px] object-cover rounded-[8px] border border-mint-hairline mt-2" />
                    )}
                  </div>
                </div>

                {/* Owner Info */}
                <div className="border-t border-mint-hairline-soft pt-6">
                  <h3 className="text-[13px] font-semibold text-mint-stone uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> Chủ sở hữu
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4 text-[14px]">
                    <div className="text-mint-stone">Họ tên</div>
                    <div className="text-mint-ink font-medium text-right">{selectedStore.ownerName || 'N/A'}</div>
                    <div className="text-mint-stone">Email</div>
                    <div className="text-mint-ink font-medium text-right">{selectedStore.ownerEmail || 'N/A'}</div>
                    <div className="text-mint-stone">Số ĐT</div>
                    <div className="text-mint-ink font-medium text-right">{selectedStore.ownerPhone || 'N/A'}</div>
                  </div>
                </div>

                {/* Financial & Subscription Info */}
                <div className="border-t border-mint-hairline-soft pt-6">
                  <h3 className="text-[13px] font-semibold text-mint-stone uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Tài chính & Gói
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4 text-[14px]">
                    <div className="text-mint-stone">Số dư (Khả dụng)</div>
                    <div className="text-mint-primary font-semibold text-right">{formatVND(selectedStore.availableBalance)}</div>
                    <div className="text-mint-stone">Số dư (Chờ)</div>
                    <div className="text-mint-ink font-medium text-right">{formatVND(selectedStore.pendingBalance)}</div>
                    <div className="col-span-2 flex items-center justify-between bg-mint-surface p-3 rounded-[8px] mt-2">
                      <div className="flex items-center gap-2 text-mint-stone">
                        <Calendar className="w-4 h-4" /> Gói ĐK hiện tại
                      </div>
                      <div className="text-mint-ink font-semibold">
                        {selectedStore.currentPlanName || 'Không có'}
                      </div>
                    </div>
                  </div>
                </div>

              </>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-inter">
          <div className="bg-mint-canvas rounded-[12px] border border-mint-hairline p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-bold text-mint-ink mb-4">Xác nhận</h3>
            <p className="text-mint-stone text-sm mb-6">{confirmAction.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-mint-surface hover:bg-mint-surface-soft text-mint-stone hover:text-mint-ink font-medium text-sm rounded-[8px] transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={executeConfirmAction}
                className="px-4 py-2 bg-mint-brand-green hover:bg-mint-brand-green/90 text-white font-medium text-sm rounded-[8px] transition-colors shadow-sm"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
