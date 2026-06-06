import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import type { AdminStoreApprovalDTO } from '../../api/admin.api';
import { Check, X, Building, MapPin, Phone, MessageSquare, User } from 'lucide-react';

export default function StoreApprovalPage() {
  const [stores, setStores] = useState<AdminStoreApprovalDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const fetchStores = () => {
    setLoading(true);
    adminApi.getPendingStores()
      .then(setStores)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn duyệt cửa hàng này?')) return;
    try {
      await adminApi.approveStore(id);
      setStores(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
      alert('Không thể duyệt cửa hàng');
    }
  };

  const handleReject = async (id: string) => {
    if (!reviewNotes.trim()) {
      alert('Vui lòng cung cấp lý do từ chối.');
      return;
    }
    try {
      await adminApi.rejectStore(id, reviewNotes);
      setStores(prev => prev.filter(s => s.id !== id));
      setRejectingId(null);
      setReviewNotes('');
    } catch (e) {
      console.error(e);
      alert('Không thể từ chối cửa hàng');
    }
  };

  return (
    <div className="p-8 max-w-[1280px] mx-auto font-inter bg-mint-surface-soft min-h-[calc(100vh-64px)] rounded-tl-[16px] border-t border-l border-mint-hairline shadow-sm">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-[36px] font-semibold text-mint-ink tracking-[-0.5px] flex items-center gap-3">
            <Building className="w-8 h-8 text-mint-ink" />
            Duyệt Cửa Hàng
          </h1>
          <p className="text-[16px] text-mint-steel mt-2">Xem xét và quản lý các đơn đăng ký cửa hàng đang chờ duyệt.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-[3px] border-mint-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-mint-canvas rounded-[12px] border border-mint-hairline p-16 text-center shadow-sm">
          <div className="bg-mint-surface w-[64px] h-[64px] rounded-full flex items-center justify-center mx-auto mb-4 border border-mint-hairline-soft">
            <Check className="w-[32px] h-[32px] text-mint-brand-green" />
          </div>
          <h3 className="text-[22px] font-semibold text-mint-ink">Tất cả đã xong!</h3>
          <p className="text-[16px] text-mint-steel mt-2">Không có đơn đăng ký cửa hàng nào đang chờ duyệt.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stores.map(store => (
            <div key={store.id} className="bg-mint-canvas rounded-[12px] border border-mint-hairline hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow flex flex-col overflow-hidden">
              <div className="p-[24px] flex-1">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-[22px] font-semibold text-mint-ink leading-tight">{store.name}</h3>
                  <span className="bg-[#c37d0d]/10 text-[#c37d0d] text-[11px] font-semibold px-2 py-0.5 rounded-[6px] uppercase tracking-[0.5px]">
                    Chờ duyệt
                  </span>
                </div>

                <div className="space-y-3 text-[14px] text-mint-steel mb-6">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-mint-stone shrink-0" />
                    <span>{store.addressLine}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-mint-stone shrink-0" />
                    <span>{store.phoneNumber || 'Không cung cấp'}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t border-mint-hairline-soft mt-4">
                    <User className="w-4 h-4 text-mint-stone shrink-0" />
                    <div>
                      <span className="font-medium text-mint-ink">{store.ownerName}</span>
                      <span className="text-mint-stone ml-2">{store.ownerEmail}</span>
                    </div>
                  </div>
                  {/* Trust Info */}
                  <div className="flex flex-col gap-2 pt-4 border-t border-mint-hairline-soft mt-4">
                    {store.referenceLink && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-mint-brand-green shrink-0" />
                        <a href={store.referenceLink} target="_blank" rel="noreferrer" className="text-mint-primary hover:underline font-medium">
                          Link tham chiếu (Maps/Fanpage)
                        </a>
                      </div>
                    )}
                    {store.storefrontImageUrl && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-mint-brand-green shrink-0" />
                        <a href={store.storefrontImageUrl} target="_blank" rel="noreferrer" className="text-mint-primary hover:underline font-medium">
                          Xem Ảnh mặt tiền cửa hàng
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[13px] text-mint-stone font-medium">
                  Đăng ký vào {new Date(store.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="bg-mint-surface p-[24px] border-t border-mint-hairline-soft">
                {rejectingId === store.id ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-mint-stone" />
                      <textarea
                        autoFocus
                        placeholder="Lý do từ chối..."
                        value={reviewNotes}
                        onChange={e => setReviewNotes(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-mint-canvas border border-mint-brand-error text-mint-ink rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#d45656]/20 focus:border-[#d45656] text-[14px] min-h-[80px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(store.id)}
                        className="flex-1 bg-mint-brand-error text-mint-on-primary py-[10px] rounded-[9999px] text-[14px] font-medium transition-colors hover:bg-red-600"
                      >
                        Xác nhận Từ chối
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setReviewNotes(''); }}
                        className="bg-transparent hover:bg-mint-hairline-soft text-mint-ink border border-mint-hairline px-[16px] py-[10px] rounded-[9999px] text-[14px] font-medium transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(store.id)}
                      className="flex-1 bg-mint-primary hover:bg-mint-charcoal text-mint-on-primary py-[10px] rounded-[9999px] text-[14px] font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Duyệt
                    </button>
                    <button
                      onClick={() => setRejectingId(store.id)}
                      className="flex-1 bg-transparent hover:bg-[#d45656]/5 text-[#d45656] border border-mint-hairline hover:border-[#d45656] py-[10px] rounded-[9999px] text-[14px] font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Từ chối
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
