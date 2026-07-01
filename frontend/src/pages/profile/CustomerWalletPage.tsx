import { useQuery, useQueryClient } from '@tanstack/react-query';
import { customerWalletApi } from '@/api/wallet.api';
import { ShieldCheckIcon, HistoryIcon, WalletIcon, ArrowLeft, ArrowRight, ArrowUpRight, ArrowDownLeft, Receipt, RefreshCcw } from 'lucide-react';
import dayjs from 'dayjs';
import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function CustomerWalletPage() {
    const { data: wallet, isLoading: isWalletLoading } = useQuery({
        queryKey: ['customerWallet'],
        queryFn: customerWalletApi.getMyWallet
    });

    const { data: transactions, isLoading: isTxLoading } = useQuery({
        queryKey: ['customerWalletTransactions'],
        queryFn: customerWalletApi.getMyTransactions
    });

    const queryClient = useQueryClient();
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [withdrawForm, setWithdrawForm] = useState({
        amount: '',
        bankName: '',
        accountNumber: '',
        accountName: ''
    });
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(withdrawForm.amount);
        if (!amount || amount <= 0) {
            toast.error('Số tiền phải lớn hơn 0');
            return;
        }
        if (amount > (wallet?.balance || 0)) {
            toast.error('Số dư không đủ');
            return;
        }
        if (!withdrawForm.bankName || !withdrawForm.accountNumber || !withdrawForm.accountName) {
            toast.error('Vui lòng điền đầy đủ thông tin ngân hàng');
            return;
        }

        try {
            setIsWithdrawing(true);
            await customerWalletApi.requestWithdraw({
                amount,
                bankName: withdrawForm.bankName,
                accountNumber: withdrawForm.accountNumber,
                accountName: withdrawForm.accountName
            });
            toast.success('Gửi yêu cầu rút tiền thành công');
            
            // LƯU LẠI THÔNG TIN NGÂN HÀNG ĐỂ GỢI Ý CHO LẦN SAU
            localStorage.setItem('savedBankInfo', JSON.stringify({
                bankName: withdrawForm.bankName,
                accountNumber: withdrawForm.accountNumber,
                accountName: withdrawForm.accountName
            }));

            setIsWithdrawModalOpen(false);
            setWithdrawForm({ amount: '', bankName: '', accountNumber: '', accountName: '' });
            queryClient.invalidateQueries({ queryKey: ['customerWallet'] });
            queryClient.invalidateQueries({ queryKey: ['customerWalletTransactions'] });
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi rút tiền');
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleOpenWithdrawModal = () => {
        if (!wallet || wallet.balance <= 0) {
            toast.error('Số dư ví hiện tại là 0đ, không thể rút.');
            return;
        }

        const saved = localStorage.getItem('savedBankInfo');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setWithdrawForm(prev => ({
                    ...prev,
                    bankName: parsed.bankName || '',
                    accountNumber: parsed.accountNumber || '',
                    accountName: parsed.accountName || ''
                }));
            } catch (e) {}
        }

        setIsWithdrawModalOpen(true);
    };

    const getTransactionType = (type: number) => {
        switch (type) {
            case 0: return { text: 'Nạp tiền', icon: <ArrowDownLeft size={16} />, color: 'text-green-600', bg: 'bg-green-50' };
            case 1: return { text: 'Rút tiền', icon: <ArrowUpRight size={16} />, color: 'text-red-600', bg: 'bg-red-50' };
            case 2: return { text: 'Thanh toán', icon: <Receipt size={16} />, color: 'text-orange-600', bg: 'bg-orange-50' };
            case 3: return { text: 'Hoàn tiền', icon: <RefreshCcw size={16} />, color: 'text-brand-600', bg: 'bg-brand-50' };
            default: return { text: 'Khác', icon: <WalletIcon size={16} />, color: 'text-gray-600', bg: 'bg-gray-50' };
        }
    };

    const paginatedTransactions = useMemo(() => {
        if (!transactions) return [];
        const startIndex = (currentPage - 1) * itemsPerPage;
        return transactions.slice(startIndex, startIndex + itemsPerPage);
    }, [transactions, currentPage]);

    const totalPages = transactions ? Math.ceil(transactions.length / itemsPerPage) : 0;

    if (isWalletLoading || isTxLoading) {
        return <div className="p-8 text-center mt-20 text-gray-500">Đang tải dữ liệu ví...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-3xl font-bold mb-8 font-[--font-display] text-gray-900">Ví SaveFood</h1>

            <div className="flex flex-col gap-8">
                {/* Compact Wallet Info Card */}
                <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-brand-100 mb-2">
                                <WalletIcon className="w-5 h-5" />
                                <span className="font-medium uppercase tracking-wider text-sm">Số dư khả dụng</span>
                            </div>
                            <div className="text-4xl sm:text-5xl font-bold font-[--font-display] tracking-tight">
                                {wallet?.balance.toLocaleString('vi-VN')} <span className="text-2xl sm:text-3xl font-normal text-brand-100">đ</span>
                            </div>
                            <p className="mt-3 text-sm text-brand-100 flex items-center gap-1.5 max-w-sm">
                                <ShieldCheckIcon className="w-4 h-4" />
                                Dùng để thanh toán nhanh, không phí giao dịch.
                            </p>
                        </div>
                        
                        <div className="shrink-0 flex items-center gap-3">
                            <Button 
                                className="bg-white text-brand-600 hover:bg-brand-50 border-none font-bold shadow-sm px-6 py-3 rounded-xl transition-transform hover:scale-105"
                                onClick={handleOpenWithdrawModal}
                            >
                                Rút tiền về thẻ
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Transaction History Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h2 className="font-bold text-lg flex items-center gap-2 text-gray-900">
                            <HistoryIcon className="w-5 h-5 text-brand-600" />
                            Lịch sử giao dịch gần đây
                        </h2>
                        {transactions && transactions.length > 0 && (
                            <span className="text-sm text-gray-500 font-medium bg-white px-3 py-1 rounded-full border border-gray-200">
                                Tổng cộng {transactions.length} giao dịch
                            </span>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        {transactions?.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                                <HistoryIcon className="w-12 h-12 text-gray-300 mb-3" />
                                <p className="font-medium">Chưa có giao dịch nào.</p>
                                <p className="text-sm mt-1 text-gray-400">Các giao dịch nạp, rút, thanh toán sẽ xuất hiện ở đây.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
                                        <th className="font-medium px-6 py-4">Giao dịch</th>
                                        <th className="font-medium px-6 py-4">Thời gian</th>
                                        <th className="font-medium px-6 py-4">Mã đơn hàng</th>
                                        <th className="font-medium px-6 py-4 text-right">Số tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginatedTransactions.map((tx) => {
                                        const typeInfo = getTransactionType(tx.type);
                                        const isPositive = tx.type === 0 || tx.type === 3;
                                        const isFailed = tx.status === 2;
                                        const isPending = tx.status === 0;
                                        
                                        return (
                                            <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${typeInfo.bg} ${typeInfo.color} ${isFailed ? 'opacity-50' : ''}`}>
                                                            {typeInfo.icon}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`font-bold text-sm ${isFailed ? 'text-gray-400' : typeInfo.color}`}>{typeInfo.text}</div>
                                                                {isPending && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded uppercase font-bold">Chờ duyệt</span>}
                                                                {isFailed && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded uppercase font-bold">Thất bại</span>}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-0.5 max-w-[350px] truncate" title={tx.description}>
                                                                {tx.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                    {dayjs(tx.createdAt).format('HH:mm - DD/MM/YYYY')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {tx.orderCode ? (
                                                        <span className="inline-flex items-center text-xs font-mono font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200 group-hover:border-gray-300 transition-colors">
                                                            #{tx.orderCode}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {isFailed ? (
                                                        <div className="text-sm font-medium text-gray-400 line-through">
                                                            {isPositive ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')} đ
                                                        </div>
                                                    ) : (
                                                        <div className={`font-bold text-base whitespace-nowrap ${isPositive ? 'text-green-600' : 'text-gray-900'}`}>
                                                            {isPositive ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')} đ
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                            <span className="text-sm text-gray-500">
                                Hiển thị <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, transactions!.length)}</span>
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                                >
                                    <ArrowLeft size={16} />
                                </button>
                                <span className="text-sm font-medium px-2 text-gray-700">
                                    Trang {currentPage} / {totalPages}
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                                >
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Withdraw Modal */}
            {isWithdrawModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
                        <button 
                            onClick={() => setIsWithdrawModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                        <h2 className="text-xl font-bold mb-4">Rút tiền về ngân hàng</h2>
                        <div className="bg-brand-50 text-brand-700 p-3 rounded-lg text-sm mb-6 flex justify-between items-center">
                            <span>Số dư khả dụng:</span>
                            <span className="font-bold text-base">{wallet?.balance.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                                    <span>Số tiền cần rút (VNĐ)</span>
                                    {withdrawForm.amount && (
                                        <span className="text-brand-600 font-bold text-base">
                                            {Number(withdrawForm.amount).toLocaleString('vi-VN')} đ
                                        </span>
                                    )}
                                </label>
                                <Input 
                                    type="number" 
                                    min="1"
                                    max={wallet?.balance || 0}
                                    placeholder="Nhập số tiền (ví dụ: 100000)" 
                                    value={withdrawForm.amount}
                                    onChange={e => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ngân hàng (Ví dụ: Vietcombank, MB Bank)</label>
                                <Input 
                                    placeholder="Nhập tên ngân hàng..." 
                                    value={withdrawForm.bankName}
                                    onChange={e => setWithdrawForm({...withdrawForm, bankName: e.target.value})}
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
                                <Input 
                                    placeholder="Nhập số tài khoản..." 
                                    value={withdrawForm.accountNumber}
                                    onChange={e => setWithdrawForm({...withdrawForm, accountNumber: e.target.value})}
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ tài khoản (Viết hoa không dấu)</label>
                                <Input 
                                    placeholder="NGUYEN VAN A" 
                                    value={withdrawForm.accountName}
                                    onChange={e => setWithdrawForm({...withdrawForm, accountName: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => setIsWithdrawModalOpen(false)}
                                >
                                    Hủy
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="flex-1"
                                    disabled={isWithdrawing}
                                >
                                    {isWithdrawing ? 'Đang xử lý...' : 'Xác nhận rút'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
