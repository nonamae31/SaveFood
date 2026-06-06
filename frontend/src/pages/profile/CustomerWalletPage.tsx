import { useQuery } from '@tanstack/react-query';
import { customerWalletApi } from '@/api/wallet.api';
import { ShieldCheckIcon, HistoryIcon, WalletIcon } from 'lucide-react';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
        setIsWithdrawModalOpen(true);
    };

    const getTransactionType = (type: number) => {
        switch (type) {
            case 0: return { text: 'Nạp tiền', color: 'text-green-600' };
            case 1: return { text: 'Rút tiền', color: 'text-red-600' };
            case 2: return { text: 'Thanh toán đơn hàng', color: 'text-orange-600' };
            case 3: return { text: 'Hoàn tiền', color: 'text-brand-600' };
            default: return { text: 'Khác', color: 'text-gray-600' };
        }
    };

    if (isWalletLoading || isTxLoading) {
        return <div className="p-8 text-center mt-20">Đang tải...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6 font-[--font-display]">Ví SaveFood</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Wallet Info Card */}
                <div className="bg-brand-500 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-brand-100 mb-2">
                            <WalletIcon className="w-5 h-5" />
                            <span className="font-medium uppercase tracking-wider text-sm">Số dư hiện tại</span>
                        </div>
                        <div className="text-4xl font-bold font-[--font-display]">
                            {wallet?.balance.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="mt-4">
                            <Button 
                                className="bg-white text-brand-600 hover:bg-brand-50 border-none font-bold w-full sm:w-auto shadow-sm"
                                onClick={handleOpenWithdrawModal}
                            >
                                Rút tiền
                            </Button>
                        </div>
                    </div>
                    <div className="mt-8 bg-brand-600/50 p-3 rounded-lg flex items-start gap-2">
                        <ShieldCheckIcon className="w-5 h-5 shrink-0 mt-0.5 text-brand-100" />
                        <p className="text-sm text-brand-50">
                            Tiền trong ví dùng để thanh toán nhanh gọn không cần chờ đợi. Hoàn tiền 100% vào ví nếu đơn bị huỷ bởi quán.
                        </p>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-bold text-lg flex items-center gap-2 text-gray-900">
                            <HistoryIcon className="w-5 h-5 text-gray-400" />
                            Lịch sử giao dịch
                        </h2>
                    </div>

                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                        {transactions?.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                Chưa có giao dịch nào.
                            </div>
                        ) : (
                            transactions?.map((tx) => {
                                const typeInfo = getTransactionType(tx.type);
                                const isPositive = tx.type === 0 || tx.type === 3;
                                
                                return (
                                    <div key={tx.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`font-bold ${typeInfo.color}`}>{typeInfo.text}</span>
                                                {tx.orderCode && (
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                                                        ĐH {tx.orderCode}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">{tx.description}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {dayjs(tx.createdAt).format('HH:mm DD/MM/YYYY')}
                                            </p>
                                        </div>
                                        <div className={`font-bold text-lg whitespace-nowrap ${isPositive ? 'text-green-600' : 'text-gray-900'}`}>
                                            {isPositive ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')} đ
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền cần rút (VNĐ)</label>
                                <Input 
                                    type="number" 
                                    min="1" 
                                    max={wallet?.balance || 0}
                                    placeholder="Nhập số tiền..." 
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
