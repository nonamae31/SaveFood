import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import type { WalletTransactionDTO, WithdrawalRequestDTO } from '../../api/admin.api';
import { CreditCard, ArrowDownCircle, ArrowUpCircle, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { clsx } from "clsx";

type TabType = 'ledger' | 'withdrawals';

export default function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState<TabType>('ledger');
  const [loading, setLoading] = useState(false);

  // Data states
  const [transactions, setTransactions] = useState<WalletTransactionDTO[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestDTO[]>([]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [processType, setProcessType] = useState<'withdrawal'>('withdrawal');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isApprove, setIsApprove] = useState(true);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'ledger') {
        const res = await adminApi.getTransactions(page, 15);
        setTransactions(res.items);
        setTotalPages(res.totalPages);
      } else if (activeTab === 'withdrawals') {
        const res = await adminApi.getWithdrawals(page, 15);
        setWithdrawals(res.items);
        setTotalPages(res.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, page]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
  };

  const openProcessModal = (type: 'withdrawal', id: string, approve: boolean) => {
    setProcessType(type);
    setSelectedId(id);
    setIsApprove(approve);
    setAdminNote('');
    setModalOpen(true);
  };

  const handleProcess = async () => {
    if (!selectedId) return;
    setProcessing(true);
    try {
      if (processType === 'withdrawal') {
        await adminApi.processWithdrawal(selectedId, { isApproved: isApprove, adminNote });
      }
      setModalOpen(false);
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Processing failed:', error);
      alert('Action failed. Please check the console or try again.');
    } finally {
      setProcessing(false);
    }
  };

  const renderStatus = (status: number, type: 'tx' | 'withdrawal') => {
    if (type === 'tx') {
      if (status === 1) return <span className="inline-flex items-center gap-1 text-[12px] font-medium text-mint-brand-green bg-mint-brand-green/10 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Hoàn thành</span>;
      if (status === 2) return <span className="inline-flex items-center gap-1 text-[12px] font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3" /> Thất bại</span>;
      if (status === 3) return <span className="inline-flex items-center gap-1 text-[12px] font-medium text-mint-stone bg-mint-canvas px-2 py-1 rounded-full">Đã hủy</span>;
      return <span className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Đang chờ</span>;
    } 
    
    if (type === 'withdrawal') {
      if (status === 1) return <span className="inline-flex items-center gap-1 text-[12px] font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Đang xử lý</span>;
      if (status === 2) return <span className="inline-flex items-center gap-1 text-[12px] font-medium text-mint-brand-green bg-mint-brand-green/10 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Đã thanh toán</span>;
      if (status === 3) return <span className="inline-flex items-center gap-1 text-[12px] font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3" /> Bị từ chối</span>;
      return <span className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Đang chờ</span>;
    }
    
    return null;
  };

  return (
    <div className="p-8 max-w-[1280px] mx-auto font-inter bg-mint-surface-soft min-h-[calc(100vh-64px)] rounded-tl-[16px] border-t border-l border-mint-hairline shadow-sm">
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold text-mint-ink tracking-tight flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-mint-brand-green" />
          Quản lý Tài chính
        </h1>
        <p className="text-mint-stone mt-1 text-[14px]">Quản lý sổ cái hệ thống và thanh toán cửa hàng.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-mint-hairline mb-6">
        <button
          onClick={() => handleTabChange('ledger')}
          className={clsx(
            "px-4 py-2 text-[14px] font-medium rounded-t-lg transition-colors relative",
            activeTab === 'ledger' ? "text-mint-brand-green bg-mint-brand-green/5" : "text-mint-stone hover:text-mint-ink hover:bg-mint-canvas"
          )}
        >
          Sổ cái Giao dịch
          {activeTab === 'ledger' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-mint-brand-green" />}
        </button>
        <button
          onClick={() => handleTabChange('withdrawals')}
          className={clsx(
            "px-4 py-2 text-[14px] font-medium rounded-t-lg transition-colors relative",
            activeTab === 'withdrawals' ? "text-mint-brand-green bg-mint-brand-green/5" : "text-mint-stone hover:text-mint-ink hover:bg-mint-canvas"
          )}
        >
          Yêu cầu Rút tiền
          {activeTab === 'withdrawals' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-mint-brand-green" />}
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-mint-hairline rounded-[12px] shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="w-8 h-8 border-[3px] border-mint-brand-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-mint-canvas/50 border-b border-mint-hairline">
                  {activeTab === 'ledger' && (
                    <>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Ngày</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Cửa hàng</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Mô tả</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider text-right">Số tiền</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Trạng thái</th>
                    </>
                  )}
                  {activeTab === 'withdrawals' && (
                    <>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Ngày</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Cửa hàng</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Thông tin Ngân hàng</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider text-right">Số tiền</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider text-right">Thao tác</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-mint-hairline">
                {activeTab === 'ledger' && transactions.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-mint-stone">Không tìm thấy giao dịch nào</td></tr>
                )}
                {activeTab === 'ledger' && transactions.filter(t => t.type !== 2).map(t => (
                  <tr key={t.id} className="hover:bg-mint-canvas/30 transition-colors">
                    <td className="px-6 py-4 text-[14px] text-mint-ink">{formatDate(t.createdAt)}</td>
                    <td className="px-6 py-4 text-[14px] font-medium text-mint-ink">{t.storeName}</td>
                    <td className="px-6 py-4 text-[14px] text-mint-stone">{t.description || '-'}</td>
                    <td className="px-6 py-4 text-[14px] font-medium text-right">
                      {t.type === 1 ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-mint-stone text-[12px] font-normal">
                            Đơn hàng: {formatCurrency(t.amount)}
                          </span>
                          <span className="text-mint-brand-green flex items-center justify-end gap-1">
                            <ArrowUpCircle className="w-3 h-3" /> +{formatCurrency(t.amount * 0.05)}
                          </span>
                        </div>
                      ) : (
                        t.amount > 0 ? (
                          <span className="text-mint-brand-green flex items-center justify-end gap-1"><ArrowUpCircle className="w-3 h-3" /> +{formatCurrency(t.amount)}</span>
                        ) : (
                          <span className="text-red-500 flex items-center justify-end gap-1"><ArrowDownCircle className="w-3 h-3" /> {formatCurrency(t.amount)}</span>
                        )
                      )}
                    </td>
                    <td className="px-6 py-4">{renderStatus(t.status, 'tx')}</td>
                  </tr>
                ))}

                {activeTab === 'withdrawals' && withdrawals.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-mint-stone">Không tìm thấy yêu cầu rút tiền nào</td></tr>
                )}
                {activeTab === 'withdrawals' && withdrawals.map(w => (
                  <tr key={w.id} className="hover:bg-mint-canvas/30 transition-colors">
                    <td className="px-6 py-4 text-[14px] text-mint-ink">{formatDate(w.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="text-[14px] font-medium text-mint-ink">{w.requesterName}</div>
                      <div className="text-[12px] text-mint-stone uppercase">{w.requesterType}</div>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-mint-stone">
                      <div><span className="font-medium text-mint-ink">Ngân hàng:</span> {w.bankName}</div>
                      <div><span className="font-medium text-mint-ink">STK:</span> {w.bankAccountNumber}</div>
                      <div><span className="font-medium text-mint-ink">Tên:</span> {w.bankAccountName}</div>
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium text-right text-mint-ink">{formatCurrency(w.amount)}</td>
                    <td className="px-6 py-4">{renderStatus(w.status, 'withdrawal')}</td>
                    <td className="px-6 py-4 text-right">
                      {(w.status === 0 || w.status === 1) && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openProcessModal('withdrawal', w.id, true)}
                            className="px-3 py-1.5 bg-mint-brand-green text-white text-[13px] font-medium rounded-md hover:bg-mint-brand-green/90 transition-colors"
                          >
                            Đã Thanh Toán
                          </button>
                          <button 
                            onClick={() => openProcessModal('withdrawal', w.id, false)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 text-[13px] font-medium rounded-md hover:bg-red-100 transition-colors"
                          >
                            Từ chối
                          </button>
                        </div>
                      )}
                      {(w.status !== 0 && w.status !== 1) && <span className="text-[12px] text-mint-stone">{w.adminNote ? `Ghi chú: ${w.adminNote}` : '-'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {!loading && totalPages > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-mint-hairline-soft bg-mint-surface/50">
            <span className="text-[13px] text-mint-stone">
              Trang {page} trên tổng số {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded-[6px] hover:bg-mint-canvas border border-transparent hover:border-mint-hairline text-mint-stone hover:text-mint-ink disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={clsx(
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
                disabled={page === totalPages}
                className="p-1 rounded-[6px] hover:bg-mint-canvas border border-transparent hover:border-mint-hairline text-mint-stone hover:text-mint-ink disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Process Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-[18px] font-semibold text-mint-ink mb-2">
                {isApprove 
                  ? 'Xác nhận Thanh toán'
                  : 'Từ chối Yêu cầu'}
              </h2>
              <p className="text-[14px] text-mint-stone mb-6">
                {isApprove 
                  ? "Bạn có chắc chắn đã chuyển tiền thủ công qua ngân hàng chưa? Hành động này sẽ đánh dấu yêu cầu là đã hoàn thành trong hệ thống."
                  : "Vui lòng cung cấp lý do từ chối yêu cầu này. Tiền sẽ không được chuyển."}
              </p>

              <div className="mb-6">
                <label className="block text-[13px] font-medium text-mint-ink mb-1">
                  Ghi chú của Admin {isApprove ? '(Tùy chọn)' : '(Bắt buộc)'}
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full h-24 px-3 py-2 text-[14px] border border-mint-hairline rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-brand-green/20 focus:border-mint-brand-green resize-none"
                  placeholder="Nhập thông tin chi tiết..."
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setModalOpen(false)}
                  disabled={processing}
                  className="px-4 py-2 text-[14px] font-medium text-mint-stone hover:text-mint-ink transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleProcess}
                  disabled={processing || (!isApprove && !adminNote.trim())}
                  className={clsx(
                    "px-4 py-2 text-[14px] font-medium rounded-lg text-white transition-colors flex items-center gap-2",
                    isApprove ? "bg-mint-brand-green hover:bg-mint-brand-green/90" : "bg-red-500 hover:bg-red-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {processing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {isApprove ? 'Xác nhận' : 'Từ chối'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
