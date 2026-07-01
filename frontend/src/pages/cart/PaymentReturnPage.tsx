import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { apiClient } from '@/lib/apiClient';

export function PaymentReturnPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    const orderCode = searchParams.get('orderCode') || searchParams.get('orderId');
    const cancel = searchParams.get('cancel') === 'true';
    const paymentStatus = searchParams.get('status');

    useEffect(() => {
        if (!orderCode) {
            setStatus('error');
            return;
        }

        if (cancel || paymentStatus === 'CANCELLED') {
            setStatus('error');
            return;
        }

        // Call backend verify
        apiClient(`/payments/verify/${orderCode}`)
            .then((res: any) => {
                if (res && res.success === true) {
                    setStatus('success');
                } else {
                    console.error('Xác thực thanh toán thất bại:', res);
                    setStatus('error');
                }
            })
            .catch((err) => {
                console.error('Lỗi xác thực thanh toán:', err);
                setStatus('error');
            });
    }, [orderCode, cancel, paymentStatus]);

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-6 mt-20 mb-20 text-center">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-brand-500 animate-spin mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Đang xác thực thanh toán...</h2>
                        <p className="text-gray-500">Vui lòng đợi trong giây lát.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-[--animate-scale-in]">
                        <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h2>
                        <p className="text-gray-500 mb-8">Cảm ơn bạn đã giải cứu đồ ăn. Đơn hàng của bạn đã được xác nhận.</p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => navigate(ROUTES.HOME)}
                                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                            >
                                Về trang chủ
                            </button>
                            <button 
                                onClick={() => navigate(ROUTES.MY_ORDERS)}
                                className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors"
                            >
                                Xem đơn hàng
                            </button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center animate-[--animate-scale-in]">
                        <XCircle className="w-20 h-20 text-red-500 mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán không thành công</h2>
                        <p className="text-gray-500 mb-8">
                            Đã có lỗi xảy ra hoặc bạn đã hủy thanh toán. 
                            Nếu bạn đã bị trừ tiền, vui lòng liên hệ bộ phận hỗ trợ.
                        </p>
                        <button 
                            onClick={() => navigate(ROUTES.MY_ORDERS)}
                            className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors"
                        >
                            Quay lại danh sách đơn hàng
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
