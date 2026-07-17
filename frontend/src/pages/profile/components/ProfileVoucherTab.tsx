import React from 'react';
import { useVoucherFund } from '@/hooks/useVoucherFund';
import { Loader2, Gift, TrendingUp, Receipt, AlertCircle } from 'lucide-react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function shortOrderId(orderId: string) {
  return orderId.slice(0, 8).toUpperCase();
}

export function ProfileVoucherTab() {
  const { data: fund, isLoading, isError } = useVoucherFund();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-brand-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-500">
        <AlertCircle size={36} />
        <p className="font-medium">Không thể tải dữ liệu Voucher. Vui lòng thử lại.</p>
      </div>
    );
  }

  const hasTransactions = (fund?.totalTransactions ?? 0) > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-12 h-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-700 shadow-sm" />
          <span className="text-sm font-bold text-brand-700 uppercase tracking-wider">
            Tích lũy Voucher
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Quỹ Voucher sẽ tự động được tích lũy sau mỗi đơn hàng hoàn thành.
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Main Balance */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-lg">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -left-4 w-20 h-20 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 opacity-90">
              <Gift size={18} />
              <span className="text-sm font-semibold">Số dư hiện tại</span>
            </div>
            <p className="text-3xl font-bold tracking-tight">
              {formatCurrency(fund?.accumulatedBalance ?? 0)}
            </p>
            {fund && fund.accumulatedBalance > fund.availableBalance ? (
              <p className="text-xs mt-2 text-amber-200">
                Đang giữ {formatCurrency(fund.accumulatedBalance - fund.availableBalance)} cho đơn hàng chưa hoàn tất
              </p>
            ) : (
              <p className="text-xs mt-2 opacity-75">Dùng để thanh toán đơn hàng tiếp theo</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-green-50 border border-green-100 p-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <TrendingUp size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Tổng đã tích lũy</p>
              <p className="text-lg font-bold text-green-700">
                {formatCurrency(fund?.totalEarned ?? 0)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-blue-50 border border-blue-100 p-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Receipt size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Số đơn đã tích</p>
              <p className="text-lg font-bold text-blue-700">
                {fund?.totalTransactions ?? 0} đơn
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h3 className="font-bold text-gray-800 text-sm">Lịch sử tích lũy</h3>
          {(fund?.totalTransactions ?? 0) > (fund?.recentTransactions.length ?? 0) && (
            <span className="text-xs text-gray-400">
              Hiển thị {fund?.recentTransactions.length} / {fund?.totalTransactions} giao dịch
            </span>
          )}
        </div>

        {!hasTransactions ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <Gift size={26} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Chưa có lịch sử tích lũy</p>
            <p className="text-xs text-gray-400 text-center max-w-xs">
              Hoàn thành đơn hàng đầu tiên của bạn để bắt đầu tích lũy Voucher.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {fund?.recentTransactions.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <span className="font-bold text-sm">{tx.amount > 0 ? '+' : '-'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Đơn #{tx.orderCode || shortOrderId(tx.orderId)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </p>
                  {tx.orderTotal > 0 && (
                    <p className="text-xs text-gray-400">
                      / {formatCurrency(tx.orderTotal)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 p-4">
        <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 leading-relaxed">
          Voucher được tích lũy từ các đơn hàng <strong>đã nhận hàng thành công</strong> (quét mã tại quầy). 
          Đơn hủy, đơn hoàn tiền, hoặc không đến lấy hàng không được tính.
        </p>
      </div>
    </div>
  );
}
