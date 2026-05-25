import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import type { WalletTransactionDTO, WithdrawalRequestDTO, RefundRequestDTO } from '../../api/admin.api';
import { CreditCard, ArrowDownCircle, ArrowUpCircle, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { clsx } from "clsx";

type TabType = 'ledger' | 'withdrawals' | 'refunds';

export default function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState<TabType>('ledger');
  const [loading, setLoading] = useState(false);

  // Data states
  const [transactions, setTransactions] = useState<WalletTransactionDTO[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestDTO[]>([]);
  const [refunds, setRefunds] = useState<RefundRequestDTO[]>([]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [processType, setProcessType] = useState<'withdrawal' | 'refund'>('withdrawal');
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
      } else if (activeTab === 'refunds') {
        const res = await adminApi.getRefunds(page, 15);
        setRefunds(res.items);
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

  const openProcessModal = (type: 'withdrawal' | 'refund', id: string, approve: boolean) => {
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
      } else {
        await adminApi.processRefund(selectedId, { isApproved: isApprove, adminNote });
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

  const renderStatus = (status: number, type: 'tx' | 'req') => {
    if (type === 'tx') {
      // WalletTransaction StatusEnum: 1=Pending, 2=Completed, 3=Failed
      if (status === 2) return <span className="inline-flex items-center gap-1 text-[12px] font-medium text-mint-brand-green bg-mint-brand-green/10 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Completed</span>;
      if (status === 3) return <span className="inline-flex items-center gap-1 text-[12px] font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3" /> Failed</span>;
      return <span className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Pending</span>;
    } else {
      // Withdrawal/Refund StatusEnum: 1=Pending, 2=Processing, 3=Paid/Refunded, 4=Rejected
      if (status === 3) return <span className="inline-flex items-center gap-1 text-[12px] font-medium text-mint-brand-green bg-mint-brand-green/10 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Processed</span>;
      if (status === 4) return <span className="inline-flex items-center gap-1 text-[12px] font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3" /> Rejected</span>;
      if (status === 2) return <span className="inline-flex items-center gap-1 text-[12px] font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Processing</span>;
      return <span className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold text-mint-ink tracking-tight flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-mint-brand-green" />
          Finance Management
        </h1>
        <p className="text-mint-stone mt-1 text-[14px]">Manage system ledger, store payouts, and customer refunds.</p>
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
          Transaction Ledger
          {activeTab === 'ledger' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-mint-brand-green" />}
        </button>
        <button
          onClick={() => handleTabChange('withdrawals')}
          className={clsx(
            "px-4 py-2 text-[14px] font-medium rounded-t-lg transition-colors relative",
            activeTab === 'withdrawals' ? "text-mint-brand-green bg-mint-brand-green/5" : "text-mint-stone hover:text-mint-ink hover:bg-mint-canvas"
          )}
        >
          Withdrawal Requests
          {activeTab === 'withdrawals' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-mint-brand-green" />}
        </button>
        <button
          onClick={() => handleTabChange('refunds')}
          className={clsx(
            "px-4 py-2 text-[14px] font-medium rounded-t-lg transition-colors relative",
            activeTab === 'refunds' ? "text-mint-brand-green bg-mint-brand-green/5" : "text-mint-stone hover:text-mint-ink hover:bg-mint-canvas"
          )}
        >
          Refund Requests
          {activeTab === 'refunds' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-mint-brand-green" />}
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
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Store</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider text-right">Amount</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Status</th>
                    </>
                  )}
                  {activeTab === 'withdrawals' && (
                    <>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Store</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Bank Details</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider text-right">Amount</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider text-right">Actions</th>
                    </>
                  )}
                  {activeTab === 'refunds' && (
                    <>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Reason & Bank</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider text-right">Amount</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-[13px] font-semibold text-mint-stone uppercase tracking-wider text-right">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-mint-hairline">
                {activeTab === 'ledger' && transactions.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-mint-stone">No transactions found</td></tr>
                )}
                {activeTab === 'ledger' && transactions.map(t => (
                  <tr key={t.id} className="hover:bg-mint-canvas/30 transition-colors">
                    <td className="px-6 py-4 text-[14px] text-mint-ink">{formatDate(t.createdAt)}</td>
                    <td className="px-6 py-4 text-[14px] font-medium text-mint-ink">{t.storeName}</td>
                    <td className="px-6 py-4 text-[14px] text-mint-stone">{t.description || '-'}</td>
                    <td className="px-6 py-4 text-[14px] font-medium text-right">
                      {t.amount > 0 ? (
                        <span className="text-mint-brand-green flex items-center justify-end gap-1"><ArrowUpCircle className="w-3 h-3" /> +{formatCurrency(t.amount)}</span>
                      ) : (
                        <span className="text-red-500 flex items-center justify-end gap-1"><ArrowDownCircle className="w-3 h-3" /> {formatCurrency(t.amount)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{renderStatus(t.status, 'tx')}</td>
                  </tr>
                ))}

                {activeTab === 'withdrawals' && withdrawals.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-mint-stone">No withdrawal requests found</td></tr>
                )}
                {activeTab === 'withdrawals' && withdrawals.map(w => (
                  <tr key={w.id} className="hover:bg-mint-canvas/30 transition-colors">
                    <td className="px-6 py-4 text-[14px] text-mint-ink">{formatDate(w.createdAt)}</td>
                    <td className="px-6 py-4 text-[14px] font-medium text-mint-ink">{w.storeName}</td>
                    <td className="px-6 py-4 text-[13px] text-mint-stone">
                      <div><span className="font-medium text-mint-ink">Bank:</span> {w.bankName}</div>
                      <div><span className="font-medium text-mint-ink">Acc:</span> {w.bankAccountNumber}</div>
                      <div><span className="font-medium text-mint-ink">Name:</span> {w.bankAccountName}</div>
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium text-right text-mint-ink">{formatCurrency(w.amount)}</td>
                    <td className="px-6 py-4">{renderStatus(w.status, 'req')}</td>
                    <td className="px-6 py-4 text-right">
                      {w.status === 1 && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openProcessModal('withdrawal', w.id, true)}
                            className="px-3 py-1.5 bg-mint-brand-green text-white text-[13px] font-medium rounded-md hover:bg-mint-brand-green/90 transition-colors"
                          >
                            Mark Paid
                          </button>
                          <button 
                            onClick={() => openProcessModal('withdrawal', w.id, false)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 text-[13px] font-medium rounded-md hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {w.status !== 1 && <span className="text-[12px] text-mint-stone">{w.adminNote ? `Note: ${w.adminNote}` : '-'}</span>}
                    </td>
                  </tr>
                ))}

                {activeTab === 'refunds' && refunds.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-mint-stone">No refund requests found</td></tr>
                )}
                {activeTab === 'refunds' && refunds.map(r => (
                  <tr key={r.id} className="hover:bg-mint-canvas/30 transition-colors">
                    <td className="px-6 py-4 text-[14px] text-mint-ink">{formatDate(r.createdAt)}</td>
                    <td className="px-6 py-4 text-[14px] font-medium text-mint-ink">{r.customerName}</td>
                    <td className="px-6 py-4 text-[13px] text-mint-stone">
                      <div className="mb-1"><span className="font-medium text-mint-ink">Reason:</span> {r.reason}</div>
                      <div className="p-2 bg-mint-canvas rounded border border-mint-hairline text-[12px]">
                        {r.customerBankName ? (
                          <>
                            <div>{r.customerBankName}</div>
                            <div>{r.customerBankAccount}</div>
                            <div>{r.customerBankAccountName}</div>
                          </>
                        ) : (
                          <span className="italic text-amber-600">Pending Bank Info</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium text-right text-mint-ink">{formatCurrency(r.amount)}</td>
                    <td className="px-6 py-4">{renderStatus(r.status, 'req')}</td>
                    <td className="px-6 py-4 text-right">
                      {r.status === 1 && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openProcessModal('refund', r.id, true)}
                            disabled={!r.customerBankName}
                            className="px-3 py-1.5 bg-mint-brand-green text-white text-[13px] font-medium rounded-md hover:bg-mint-brand-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!r.customerBankName ? "Waiting for customer to provide bank info" : ""}
                          >
                            Mark Refunded
                          </button>
                          <button 
                            onClick={() => openProcessModal('refund', r.id, false)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 text-[13px] font-medium rounded-md hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {r.status !== 1 && <span className="text-[12px] text-mint-stone">{r.adminNote ? `Note: ${r.adminNote}` : '-'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-mint-hairline flex items-center justify-between">
            <span className="text-[13px] text-mint-stone">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-[13px] border border-mint-hairline rounded hover:bg-mint-canvas disabled:opacity-50"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-[13px] border border-mint-hairline rounded hover:bg-mint-canvas disabled:opacity-50"
              >
                Next
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
                  ? (processType === 'withdrawal' ? 'Confirm Payout' : 'Confirm Refund') 
                  : 'Reject Request'}
              </h2>
              <p className="text-[14px] text-mint-stone mb-6">
                {isApprove 
                  ? "Are you sure you have manually transferred the money via the bank? This action will mark the request as completed in the system."
                  : "Please provide a reason for rejecting this request. The funds will not be transferred."}
              </p>

              <div className="mb-6">
                <label className="block text-[13px] font-medium text-mint-ink mb-1">
                  Admin Note {isApprove ? '(Optional)' : '(Required)'}
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full h-24 px-3 py-2 text-[14px] border border-mint-hairline rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-brand-green/20 focus:border-mint-brand-green resize-none"
                  placeholder="Enter details..."
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setModalOpen(false)}
                  disabled={processing}
                  className="px-4 py-2 text-[14px] font-medium text-mint-stone hover:text-mint-ink transition-colors"
                >
                  Cancel
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
                  {isApprove ? 'Confirm' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
