import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { FileText, Download, Search, ShieldCheck, TrendingUp, CreditCard, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface AuditItem {
  date: string;
  type: string;
  customerName: string;
  customerEmail: string;
  storeName: string;
  orderCode: string;
  payOsRef: string;
  payerAccountNumber: string;
  payerName: string;
  payerBankId: string;
  totalAmount: number;
  platformRevenue: number;
  category: string;
  paymentMethod: string;
}

interface AuditResponse {
  items: AuditItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  summary: {
    totalOrders: number;
    totalSubscriptions: number;
    totalPlatformRevenue: number;
  };
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7251/api';

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

const BANK_BIN_MAP: Record<string, string> = {
  '970422': 'MBBank',
  '970436': 'Vietcombank',
  '970415': 'VietinBank',
  '970418': 'BIDV',
  '01202001': 'BIDV', // CITAD code cho BIDV
  '970405': 'Agribank',
  '970407': 'Techcombank',
  '01310001': 'Techcombank', // CITAD code cho Techcombank
  '970416': 'ACB',
  '970432': 'VPBank',
  '970423': 'TPBank',
  '970403': 'Sacombank',
  '970441': 'VIB',
  '970443': 'SHB',
  '970431': 'Eximbank',
  '970437': 'HDBank',
  '970440': 'SeABank',
  '970449': 'LPBank',
  '970412': 'PVcomBank',
  '970428': 'NamABank',
};

const getBankName = (bin: string) => {
  if (!bin || bin === '-') return '—';
  return BANK_BIN_MAP[bin] ? `${BANK_BIN_MAP[bin]} (${bin})` : bin;
};

export default function AdminAuditPage() {
  const getVietnamDateString = (date: Date) => {
    return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  };

  const todayDate = new Date();
  const today = getVietnamDateString(todayDate);

  const oneMonthAgoDate = new Date();
  oneMonthAgoDate.setMonth(oneMonthAgoDate.getMonth() - 1);
  const oneMonthAgo = getVietnamDateString(oneMonthAgoDate);

  const [from, setFrom] = useState(oneMonthAgo);
  const [to, setTo] = useState(today);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient<AuditResponse>(
        `/admin/audit/report?from=${from}&to=${to}&page=${p}&pageSize=50`
      );
      setData(result);
      setPage(p);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(1);
  }, []);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/audit/export-csv?from=${from}&to=${to}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Export thất bại');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `savefood_audit_${from}_${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xuất CSV');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto font-inter bg-mint-surface-soft min-h-[calc(100vh-64px)] rounded-tl-[16px] border-t border-l border-mint-hairline shadow-sm">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-mint-ink tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-mint-brand-green" />
            Báo cáo Kiểm toán Tài chính
          </h1>
          <p className="text-mint-stone mt-1 text-[14px]">
            Đối chiếu toàn bộ luồng tiền — đơn hàng & gói subscription
          </p>
        </div>
        <button
          id="btn-export-csv"
          onClick={handleExportCsv}
          disabled={exporting || !data}
          className="flex items-center gap-2 px-4 py-2 bg-mint-brand-green text-white text-[14px] font-medium rounded-lg hover:bg-mint-brand-green/90 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Đang xuất...' : 'Xuất CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-mint-hairline rounded-[12px] p-5 mb-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-[13px] font-medium text-mint-stone mb-1">Từ ngày</label>
            <input
              id="filter-from-date"
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="px-3 py-2 text-[14px] border border-mint-hairline rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-brand-green/20 focus:border-mint-brand-green"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-mint-stone mb-1">Đến ngày</label>
            <input
              id="filter-to-date"
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="px-3 py-2 text-[14px] border border-mint-hairline rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-brand-green/20 focus:border-mint-brand-green"
            />
          </div>
          <button
            id="btn-load-report"
            onClick={() => fetchReport(1)}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-mint-ink text-white text-[14px] font-medium rounded-lg hover:bg-mint-ink/90 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Đang tải...' : 'Xem báo cáo'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[14px] px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-mint-hairline rounded-[12px] p-5 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[12px] text-mint-stone">Doanh thu nền tảng</p>
              <p className="text-[20px] font-bold text-mint-ink">{formatVND(data.summary.totalPlatformRevenue)}</p>
            </div>
          </div>
          <div className="bg-white border border-mint-hairline rounded-[12px] p-5 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[12px] text-mint-stone">Đơn hàng có thanh toán</p>
              <p className="text-[20px] font-bold text-mint-ink">{data.summary.totalOrders.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white border border-mint-hairline rounded-[12px] p-5 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-[12px] text-mint-stone">Giao dịch Subscription</p>
              <p className="text-[20px] font-bold text-mint-ink">{data.summary.totalSubscriptions.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {data && (
        <div className="bg-white border border-mint-hairline rounded-[12px] shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-mint-canvas/50 border-b border-mint-hairline">
                  <th className="px-4 py-3 text-[11px] font-semibold text-mint-stone uppercase tracking-wider whitespace-nowrap">Ngày / Loại</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-mint-stone uppercase tracking-wider">Khách / Shop</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-mint-stone uppercase tracking-wider">Mã giao dịch</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-mint-stone uppercase tracking-wider">Thông tin Ngân hàng</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-mint-stone uppercase tracking-wider text-right">Tài chính</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mint-hairline">
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-mint-stone text-[14px]">
                      Không có giao dịch nào trong khoảng thời gian này
                    </td>
                  </tr>
                )}
                {data.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-mint-canvas/30 transition-colors align-top">
                    <td className="px-4 py-3">
                      <p className="text-[13px] text-mint-ink font-medium whitespace-nowrap">{formatDate(item.date)}</p>
                      <span className={clsx(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium mt-1',
                        item.type === 'Đơn hàng' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      )}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-mint-ink">{item.customerName}</p>
                      <p className="text-[11px] text-mint-stone mb-1">{item.customerEmail}</p>
                      <p className="text-[12px] text-mint-ink bg-mint-surface-soft px-1.5 py-0.5 rounded inline-block">🛒 {item.storeName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] text-mint-stone font-mono mb-1">Đơn: <span className="text-mint-ink">{item.orderCode}</span></p>
                      {item.payOsRef && item.payOsRef !== '-' ? (
                        <p className="text-[12px] font-mono bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 inline-block">
                          REF: {item.payOsRef}
                        </p>
                      ) : (
                        <span className="text-[12px] text-mint-stone italic">Không có REF</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.payerBankId !== '-' ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-bold bg-mint-canvas text-mint-ink px-1.5 py-0.5 rounded border border-mint-hairline self-start">
                            {getBankName(item.payerBankId)}
                          </span>
                          <p className="text-[13px] font-mono text-mint-ink">{item.payerAccountNumber}</p>
                          <p className="text-[12px] text-mint-stone">{item.payerName}</p>
                        </div>
                      ) : (
                        <span className="text-[12px] text-mint-stone italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-[14px] font-medium text-mint-ink">{formatVND(item.totalAmount)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages >= 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-mint-hairline bg-mint-canvas/50">
              <span className="text-[13px] text-mint-stone">
                Hiển thị {(data.currentPage - 1) * 50 + 1} đến {Math.min(data.currentPage * 50, data.totalCount)} trên tổng số {data.totalCount} giao dịch
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchReport(page - 1)}
                  disabled={page <= 1}
                  className="p-1 rounded-[6px] hover:bg-mint-canvas border border-transparent hover:border-mint-hairline text-mint-stone hover:text-mint-ink disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => fetchReport(p)}
                      className={clsx(
                        "w-7 h-7 rounded-[6px] text-[13px] font-medium transition-colors flex items-center justify-center",
                        data.currentPage === p ? "bg-mint-canvas border border-mint-hairline text-mint-ink shadow-sm" : "text-mint-stone hover:bg-mint-surface hover:text-mint-ink border border-transparent"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => fetchReport(page + 1)}
                  disabled={page >= data.totalPages}
                  className="p-1 rounded-[6px] hover:bg-mint-canvas border border-transparent hover:border-mint-hairline text-mint-stone hover:text-mint-ink disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && (
        <div className="bg-white border border-mint-hairline rounded-[12px] p-16 text-center shadow-sm">
          <ShieldCheck className="w-12 h-12 text-mint-stone/30 mx-auto mb-3" />
          <p className="text-[16px] font-medium text-mint-ink mb-1">Chọn khoảng thời gian và nhấn Xem báo cáo</p>
          <p className="text-[14px] text-mint-stone">Báo cáo sẽ hiển thị đầy đủ thông tin PayOS Reference và số tài khoản người chuyển</p>
        </div>
      )}
    </div>
  );
}
