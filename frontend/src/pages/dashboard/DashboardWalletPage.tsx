import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Wallet, Clock, XCircle, Plus, TrendingUp, TrendingDown, Percent, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useStoreWallet,
  useStoreTransactions,
  useStoreWithdrawals,
  useCreateWithdrawal
} from '@/hooks/useStoreFinance'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// Hàm format tiền VND
const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const getTxTypeLabel = (type: number) => {
  switch (type) {
    case 1: return 'Doanh thu đơn hàng'
    case 2: return 'Phí nền tảng'
    case 3: return 'Rút tiền'
    case 4: return 'Hoàn tiền'
    case 5: return 'Phạt'
    default: return 'Khác'
  }
}

const getTxIcon = (type: number) => {
  switch (type) {
    case 1: return <TrendingUp className="w-6 h-6 text-green-600" />
    case 2: return <Percent className="w-6 h-6 text-purple-600" />
    case 3: return <TrendingDown className="w-6 h-6 text-orange-600" />
    default: return <FileText className="w-6 h-6 text-gray-400" />
  }
}

const getTxIconBg = (type: number) => {
  switch (type) {
    case 1: return 'bg-green-100'
    case 2: return 'bg-purple-100'
    case 3: return 'bg-orange-100'
    default: return 'bg-gray-100'
  }
}

const getTxStatusLabel = (status: number) => {
  switch (status) {
    case 0: return <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs">Đang chờ</span>
    case 1: return <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">Hoàn thành</span>
    case 2: return <span className="text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs">Thất bại</span>
    case 3: return <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded-full text-xs">Đã huỷ</span>
    default: return null
  }
}

const getWithdrawalStatusLabel = (status: number) => {
  switch (status) {
    case 0: return <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-medium">Chờ duyệt</span>
    case 1: return <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium">Đang xử lý</span>
    case 2: return <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">Đã thanh toán</span>
    case 3: return <span className="text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium">Từ chối</span>
    default: return null
  }
}

const renderPagination = (currentPage: number, totalPages: number, setPage: (p: number) => void, totalCount: number = 0, pageSize: number = 10, label: string = 'mục') => {
  if (totalPages <= 1) return null;
  
  const pages = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <button
        key={i}
        onClick={() => setPage(i)}
        className={`w-7 h-7 rounded-[6px] text-[13px] font-medium transition-colors flex items-center justify-center ${currentPage === i ? "bg-white border border-gray-200 text-gray-900 shadow-sm" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent"}`}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between w-full">
      <span className="text-[13px] text-gray-500">
        Hiển thị {(currentPage - 1) * pageSize + 1} đến {Math.min(currentPage * pageSize, totalCount)} trên tổng số {totalCount} {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1 rounded-[6px] hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-gray-900 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-1">
          {startPage > 1 && <span className="px-1 text-gray-400 text-[13px] flex items-center">...</span>}
          {pages}
          {endPage < totalPages && <span className="px-1 text-gray-400 text-[13px] flex items-center">...</span>}
        </div>
        <button
          onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-1 rounded-[6px] hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-gray-900 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default function DashboardWalletPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'withdrawals'>('overview')
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)
  const [formData, setFormData] = useState({ amount: '', bankName: '', bankAccountNumber: '', bankAccountName: '' })
  const [formError, setFormError] = useState('')
  const [txPage, setTxPage] = useState(1)
  const [wdPage, setWdPage] = useState(1)

  const { data: wallet, isLoading: walletLoading } = useStoreWallet()
  const { data: txData, isLoading: txLoading } = useStoreTransactions(txPage, 10)
  const { data: wdData, isLoading: wdLoading } = useStoreWithdrawals(wdPage, 10)

  const createWithdrawal = useCreateWithdrawal()

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    const amount = Number(formData.amount)
    if (isNaN(amount) || amount < 50000) {
      setFormError('Số tiền rút tối thiểu là 50,000 VNĐ')
      return
    }

    if (wallet && amount > wallet.availableBalance) {
      setFormError('Số tiền rút vượt quá số dư khả dụng')
      return
    }

    try {
      await createWithdrawal.mutateAsync({
        amount,
        bankName: formData.bankName,
        bankAccountNumber: formData.bankAccountNumber,
        bankAccountName: formData.bankAccountName
      })
      setShowWithdrawForm(false)
      setFormData({ amount: '', bankName: '', bankAccountNumber: '', bankAccountName: '' })
    } catch (err: any) {
      setFormError(err.response?.data || err.message || 'Có lỗi xảy ra')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ví & Doanh thu" />

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('overview')}
        >
          Tổng quan ví
        </button>
        <button
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'withdrawals'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('withdrawals')}
        >
          Yêu cầu rút tiền
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Wallet Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm font-medium text-gray-500 mb-1">Số dư khả dụng</p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {walletLoading ? '...' : formatVND(wallet?.availableBalance || 0)}
                </h3>
                <p className="text-xs text-gray-400 mt-2">Tiền có thể rút ngay</p>
              </div>
              <Wallet className="absolute right-4 bottom-4 w-24 h-24 text-gray-50 opacity-50 transform translate-y-4" />
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm font-medium text-gray-500 mb-1">Số dư chờ duyệt</p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {walletLoading ? '...' : formatVND(wallet?.pendingBalance || 0)}
                </h3>
                <p className="text-xs text-gray-400 mt-2">Tiền từ các đơn hàng chưa hoàn tất</p>
              </div>
              <Clock className="absolute right-4 bottom-4 w-24 h-24 text-gray-50 opacity-50 transform translate-y-4" />
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 font-display">Lịch sử giao dịch</h3>
            </div>
            
            <div className="divide-y divide-gray-100">
              {txLoading ? (
                <div className="p-8 text-center text-gray-500">Đang tải...</div>
              ) : txData?.items.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <FileText className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Chưa có giao dịch nào</p>
                </div>
              ) : (
                txData?.items.filter(tx => tx.type !== 2).map(tx => (
                  <div key={tx.id} className="p-5 hover:bg-gray-50/80 transition-colors flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${getTxIconBg(tx.type)}`}>
                      {getTxIcon(tx.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 truncate">{getTxTypeLabel(tx.type)}</h4>
                        {getTxStatusLabel(tx.status)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">#{tx.id.substring(0, 8)}</span>
                        <span>•</span>
                        <span>{new Date(tx.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {tx.description && (
                        <p className="text-sm text-gray-500 mt-1.5 truncate">{tx.description}</p>
                      )}
                    </div>
                    
                    <div className="text-right shrink-0">
                      <div className={`text-xl font-bold tracking-tight ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {tx.amount > 0 ? '+' : ''}{formatVND(tx.amount)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Transactions Pagination */}
            {txData && txData.totalPages >= 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                {renderPagination(txData.pageNumber, txData.totalPages, setTxPage, txData.totalCount, 10, 'giao dịch')}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="space-y-6">
          {!showWithdrawForm ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Tạo yêu cầu rút tiền</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Rút tiền từ Số dư khả dụng về tài khoản ngân hàng của bạn. Số tiền rút tối thiểu là 50,000 VNĐ.
              </p>
              <Button onClick={() => setShowWithdrawForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo lệnh rút
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Thông tin rút tiền</h3>
                <button
                  onClick={() => setShowWithdrawForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-brand-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-brand-800">
                  Số dư khả dụng: <span className="font-bold text-brand-900 text-lg">{formatVND(wallet?.availableBalance || 0)}</span>
                </p>
              </div>

              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
                  {formError}
                </div>
              )}

              <form onSubmit={handleWithdrawSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền cần rút (VNĐ)</label>
                  <Input
                    type="number"
                    required
                    min="50000"
                    placeholder="VD: 500000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngân hàng thụ hưởng</label>
                  <Input
                    required
                    placeholder="VD: Vietcombank"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
                  <Input
                    required
                    placeholder="VD: 0123456789"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ tài khoản</label>
                  <Input
                    required
                    placeholder="VD: NGUYEN VAN A"
                    className="uppercase"
                    value={formData.bankAccountName}
                    onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="pt-2 flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => setShowWithdrawForm(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" isLoading={createWithdrawal.isPending}>
                    Xác nhận rút tiền
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Withdrawals Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Lịch sử rút tiền</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-3">Ngày tạo</th>
                    <th className="px-6 py-3">Ngân hàng</th>
                    <th className="px-6 py-3 text-right">Số tiền</th>
                    <th className="px-6 py-3 text-center">Trạng thái</th>
                    <th className="px-6 py-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {wdLoading ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
                  ) : wdData?.items.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Chưa có yêu cầu rút tiền nào</td></tr>
                  ) : (
                    wdData?.items.map(wd => (
                      <tr key={wd.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(wd.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{wd.bankName}</p>
                          <p className="text-xs text-gray-500">{wd.bankAccountNumber} - {wd.bankAccountName}</p>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          {formatVND(wd.amount)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getWithdrawalStatusLabel(wd.status)}
                        </td>
                        <td className="px-6 py-4">
                          {wd.adminNote ? (
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{wd.adminNote}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Withdrawals Pagination */}
            {wdData && wdData.totalPages >= 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                {renderPagination(wdData.pageNumber, wdData.totalPages, setWdPage, wdData.totalCount, 10, 'yêu cầu')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
