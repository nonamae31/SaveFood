import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCart } from "@/hooks/useCart";
import { apiClient } from "@/lib/apiClient";
import { ROUTES } from "@/lib/constants";
import { customerWalletApi } from "@/api/wallet.api";
import { useLocationContext } from "@/contexts/LocationContext";
import { ShieldCheckIcon } from "lucide-react";
import { calculateDistance } from "@/utils/distance";

// Placeholder for API
const checkoutApi = {
    checkout: async (data: { cartItemIds: string[]; paymentMethod: number; expectedPickupTime: string; agreedToNoRefundPolicy: boolean; returnUrl?: string; cancelUrl?: string; }) => {
        return apiClient<{ orderId: string; pickupCode: string; checkoutUrl?: string; reservationExpiresAt?: string }>(
            "/orders/checkout",
            {
                method: "POST",
                body: JSON.stringify(data),
            },
        );
    },
};

export function CheckoutPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [paymentMethod, setPaymentMethod] = useState<number>(0); // 0 = Wallet, 1 = PayOS
    const [expectedPickupTime, setExpectedPickupTime] = useState<string>("");
    const [agreedToPolicy, setAgreedToPolicy] = useState<boolean>(false);
    const [showDistanceWarning, setShowDistanceWarning] = useState<boolean>(false);
    const { location: userLocation } = useLocationContext();

    // Assuming we pass selected items from Cart via state
    const selectedItemIds = (location.state?.selectedCartItemIds as string[]) || [];

    const { data: cartItems, isLoading: isCartLoading } = useCart();
    
    const { data: wallet, isLoading: isWalletLoading } = useQuery({
        queryKey: ["customerWallet"],
        queryFn: customerWalletApi.getMyWallet
    });

    const hasSetDefaultPaymentRef = useRef(false);

    const totalAmount = (cartItems?.filter(item => selectedItemIds.includes(item.id)) || [])
        .reduce((sum, item) => sum + item.salePrice * item.quantity, 0);

    useEffect(() => {
        if (!isWalletLoading && wallet !== undefined && cartItems && selectedItemIds.length > 0 && !hasSetDefaultPaymentRef.current) {
            hasSetDefaultPaymentRef.current = true;
            if (wallet && wallet.balance >= totalAmount) {
                setPaymentMethod(0);
            } else {
                setPaymentMethod(1);
            }
        }
    }, [wallet, isWalletLoading, cartItems, selectedItemIds, totalAmount]);

    const checkoutMutation = useMutation({
        mutationFn: checkoutApi.checkout,
        onSuccess: (res) => {
            if (res.checkoutUrl) {
                // Redirect to PayOS
                window.location.href = res.checkoutUrl;
            } else {
                // Redirect to general orders page (or PaymentReturn) since it could be multiple orders
                navigate(`/checkout/success?orderCode=${res.orderId}`, {
                    state: {
                        pickupCode: res.pickupCode,
                        isNewOrder: true,
                    },
                });
            }
        },
        onError: (error: any) => {
            alert(error.message || "Có lỗi xảy ra khi thanh toán.");
        },
    });

    if (isCartLoading || isWalletLoading) return <div className="p-8 text-center">Đang tải...</div>;

    const checkoutItems = cartItems?.filter((item) => selectedItemIds.includes(item.id)) || [];

    if (checkoutItems.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-8 text-center">
                <p className="mb-4">Bạn chưa chọn sản phẩm nào để thanh toán.</p>
                <button onClick={() => navigate(ROUTES.CART)} className="bg-brand-500 text-white px-4 py-2 rounded">
                    Quay lại Giỏ hàng
                </button>
            </div>
        );
    }

    // totalAmount is already calculated above
    
    const groupedItems = checkoutItems.reduce((acc, item) => {
        if (!acc[item.storeId]) {
            acc[item.storeId] = { storeName: item.storeName, storeLat: item.storeLatitude, storeLng: item.storeLongitude, items: [] };
        }
        acc[item.storeId].items.push(item);
        return acc;
    }, {} as Record<string, { storeName: string, storeLat?: number, storeLng?: number, items: typeof checkoutItems }>);

    // Distance calculation is now imported from utils

    const proceedToCheckout = () => {
        checkoutMutation.mutate({
            cartItemIds: checkoutItems.map(item => item.id),
            paymentMethod: paymentMethod,
            expectedPickupTime: expectedPickupTime,
            agreedToNoRefundPolicy: agreedToPolicy,
            returnUrl: `${window.location.origin}/checkout/success`,
            cancelUrl: `${window.location.origin}/checkout/cancel`
        });
    };

    const handleCheckout = () => {
        if (!expectedPickupTime) {
            alert("Vui lòng chọn thời gian dự kiến đến lấy hàng.");
            return;
        }
        if (!agreedToPolicy) {
            alert("Vui lòng đồng ý với chính sách không hoàn tiền.");
            return;
        }
        if (paymentMethod === 0 && wallet && wallet.balance < totalAmount) {
            alert("Số dư trong Ví SaveFood không đủ để thanh toán. Vui lòng chọn phương thức khác.");
            return;
        }

        // Check distance
        if (userLocation) {
            const hasDistantStore = Object.values(groupedItems).some(g => {
                if (g.storeLat && g.storeLng) {
                    const dist = calculateDistance(userLocation.lat, userLocation.lng, g.storeLat, g.storeLng);
                    return dist > 5;
                }
                return false;
            });
            if (hasDistantStore) {
                setShowDistanceWarning(true);
                return;
            }
        }
        
        proceedToCheckout();
    };

    // Generate Time Options
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const minExpiryTime = checkoutItems.reduce((min, item) => {
        const expiry = new Date(item.expiryDate);
        return expiry < min ? expiry : min;
    }, endOfDay);

    const maxPickupTime = minExpiryTime < endOfDay ? minExpiryTime : endOfDay;
    const timeOptions: Date[] = [];

    let currentOption = new Date(now.getTime() + 30 * 60000); // now + 30 mins
    // Round up to nearest 30 mins
    currentOption.setMinutes(Math.ceil(currentOption.getMinutes() / 30) * 30, 0, 0);

    while (currentOption <= maxPickupTime) {
        timeOptions.push(new Date(currentOption));
        currentOption.setMinutes(currentOption.getMinutes() + 30);
    }

    // If no options (e.g., expiring in less than 30 mins), add maxPickupTime as the only option
    if (timeOptions.length === 0) {
        timeOptions.push(maxPickupTime);
    }

    // Set default selection
    if (!expectedPickupTime && timeOptions.length > 0) {
        setExpectedPickupTime(timeOptions[0].toISOString());
    }

    return (
        <div className="max-w-screen-2xl mx-auto px-4 xl:px-8 py-8">
            <h1 className="text-2xl font-bold mb-8">Thanh toán</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cột 1: Danh sách sản phẩm */}
                <div className="space-y-6">
                    {Object.values(groupedItems).map((group, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h2 className="text-lg font-semibold mb-4">Sản phẩm từ: {group.storeName}</h2>
                            <div className="space-y-4">
                                {group.items.map((item) => (
                                    <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="w-20 h-20 object-cover rounded-md"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-medium">{item.title}</h3>
                                            <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                                            <p className="text-brand-600 font-medium">
                                                {(item.salePrice * item.quantity).toLocaleString("vi-VN")} đ
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cột 2: Thời gian & Thanh toán */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4">Thời gian nhận hàng dự kiến</h2>
                        <p className="text-sm text-gray-500 mb-3">
                            Vui lòng chọn thời gian bạn sẽ đến lấy. Các món ăn sắp hết hạn cần được lấy sớm để đảm bảo
                            chất lượng.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {timeOptions.map((time, idx) => {
                                const timeStr = time.toISOString();
                                const isSelected = expectedPickupTime === timeStr;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setExpectedPickupTime(timeStr)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                                            isSelected 
                                                ? 'bg-brand-500 text-white border-brand-500' 
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-brand-300 hover:bg-brand-50'
                                        }`}
                                    >
                                        {time.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
                        <div className="space-y-3">
                            <label className={`flex flex-col p-4 border rounded transition-colors ${wallet && wallet.balance < totalAmount ? 'bg-gray-50 border-gray-200 opacity-70 cursor-not-allowed' : paymentMethod === 0 ? 'bg-brand-50 border-brand-500 cursor-pointer' : 'border-gray-200 cursor-pointer'}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value={0}
                                        checked={paymentMethod === 0}
                                        onChange={() => setPaymentMethod(0)}
                                        disabled={wallet && wallet.balance < totalAmount}
                                        className="w-4 h-4 text-brand-500 disabled:opacity-50"
                                    />
                                    <div className="flex-1">
                                        <span className={`font-medium flex items-center gap-2 ${wallet && wallet.balance < totalAmount ? 'text-gray-500' : 'text-gray-900'}`}>
                                            Ví SaveFood
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                <ShieldCheckIcon className="w-3 h-3" /> SaveFood Guarantee
                                            </span>
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-sm font-medium ${wallet && wallet.balance < totalAmount ? 'text-gray-500' : ''}`}>Số dư: {wallet?.balance.toLocaleString("vi-VN")} đ</span>
                                    </div>
                                </div>
                                
                                {wallet && wallet.balance < totalAmount ? (
                                    <div className="mt-2 ml-7 text-sm text-red-500 font-medium">
                                        Số dư ví hiện tại: {wallet?.balance.toLocaleString("vi-VN")} đ — không đủ để thanh toán đơn này
                                    </div>
                                ) : paymentMethod === 0 && (
                                    <div className="mt-3 ml-7 text-sm text-gray-600">
                                        Thanh toán an toàn, hoàn tiền 100% ngay lập tức nếu quán chưa xác nhận hoặc từ chối đơn hàng.
                                    </div>
                                )}
                            </label>

                            <label className={`flex flex-col p-4 border rounded cursor-pointer transition-colors ${paymentMethod === 1 ? 'bg-brand-50 border-brand-500' : 'border-gray-200'}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value={1}
                                        checked={paymentMethod === 1}
                                        onChange={() => setPaymentMethod(1)}
                                        className="w-4 h-4 text-brand-500"
                                    />
                                    <span className="font-medium text-gray-900">Thanh toán qua PayOS (Chuyển khoản / Mã QR)</span>
                                </div>
                                {paymentMethod === 1 && (
                                    <div className="mt-2 ml-7 text-sm text-gray-500">
                                        Hỗ trợ chuyển khoản nhanh 24/7 qua mã QR tới mọi ngân hàng.
                                    </div>
                                )}
                            </label>
                        </div>
                        <p className="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded">
                            * Yêu cầu thanh toán trước để giữ món. Đơn hàng sẽ tự động huỷ nếu chưa thanh toán kịp hoặc nếu bạn không đến lấy hàng sau thời gian dự kiến (Không hoàn tiền).
                        </p>
                    </div>
                </div>

                <div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-24">
                        <h2 className="text-lg font-semibold mb-4">Tổng cộng</h2>
                        <div className="flex justify-between mb-2">
                            <span>Tạm tính</span>
                            <span>{totalAmount.toLocaleString("vi-VN")} đ</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-4 mt-4">
                            <span>Tổng tiền</span>
                            <span className="text-brand-600">{totalAmount.toLocaleString("vi-VN")} đ</span>
                        </div>

                        <div className="flex items-start gap-3 mt-4 mb-4">
                            <input 
                                type="checkbox" 
                                id="policyAgree"
                                checked={agreedToPolicy}
                                onChange={(e) => setAgreedToPolicy(e.target.checked)}
                                className="mt-1 w-4 h-4 text-brand-500 rounded border-gray-300 focus:ring-brand-500"
                            />
                            <label htmlFor="policyAgree" className="text-sm text-gray-600 leading-tight">
                                Tôi hiểu và đồng ý rằng đồ ăn giải cứu có hạn sử dụng ngắn. Nếu tôi không đến lấy hàng sau thời gian dự kiến, đơn hàng sẽ tự động hủy và <strong>KHÔNG ĐƯỢC HOÀN TIỀN</strong>.
                            </label>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={checkoutMutation.isPending || !agreedToPolicy || (paymentMethod === 0 && (wallet?.balance || 0) < totalAmount)}
                            className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {checkoutMutation.isPending ? "Đang xử lý..." : "Xác nhận thanh toán"}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Modal cảnh báo khoảng cách */}
            {showDistanceWarning && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Cảnh báo khoảng cách xa
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Trong đơn hàng của bạn có cửa hàng cách xa vị trí hiện tại hơn 5km. Hãy đảm bảo bạn có thể đến lấy hàng đúng thời gian dự kiến để tránh rủi ro bị hủy đơn (không hỗ trợ hoàn tiền). Bạn có chắc chắn muốn tiếp tục không?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setShowDistanceWarning(false)}
                                className="px-4 py-2 font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={() => {
                                    setShowDistanceWarning(false);
                                    proceedToCheckout();
                                }}
                                className="px-4 py-2 font-bold text-white bg-brand-500 rounded-lg hover:bg-brand-600"
                            >
                                Chấp nhận đặt hàng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
