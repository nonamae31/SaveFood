import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/hooks/useCart";
import { apiClient } from "@/lib/apiClient";
import { ROUTES } from "@/lib/constants";
import { customerWalletApi } from "@/api/wallet.api";
import { useLocationContext } from "@/contexts/LocationContext";
import { ShieldCheckIcon } from "lucide-react";
import { calculateDistance } from "@/utils/distance";
import { useVoucherFund } from "@/hooks/useVoucherFund";
import { CoinsIcon } from "lucide-react";

// Placeholder for API
const checkoutApi = {
    checkout: async (data: { cartItemIds: string[]; paymentMethod: number; expectedPickupTime: string; agreedToNoRefundPolicy: boolean; returnUrl?: string; cancelUrl?: string; applyVoucherAmount?: number; }) => {
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
    const [applyVoucher, setApplyVoucher] = useState<boolean>(false);
    const [showDistanceWarning, setShowDistanceWarning] = useState<boolean>(false);
    const { location: userLocation } = useLocationContext();

    // Assuming we pass selected items from Cart via state
    const selectedItemIds = (location.state?.selectedCartItemIds as string[]) || [];

    const { data: cartItems, isLoading: isCartLoading } = useCart();
    
    const { data: wallet, isLoading: isWalletLoading } = useQuery({
        queryKey: ["customerWallet"],
        queryFn: customerWalletApi.getMyWallet
    });

    const { data: voucherFund, isLoading: isVoucherLoading } = useVoucherFund();

    const hasSetDefaultPaymentRef = useRef(false);

    const totalAmount = (cartItems?.filter(item => selectedItemIds.includes(item.id)) || [])
        .reduce((sum, item) => sum + item.salePrice * item.quantity, 0);

    const availableVoucher = voucherFund?.availableBalance || 0;
    const voucherDiscount = applyVoucher ? Math.min(availableVoucher, totalAmount) : 0;
    const grandTotal = totalAmount - voucherDiscount;

    useEffect(() => {
        if (!isWalletLoading && !isVoucherLoading && wallet !== undefined && cartItems && selectedItemIds.length > 0 && !hasSetDefaultPaymentRef.current) {
            hasSetDefaultPaymentRef.current = true;
            if (wallet && wallet.balance >= grandTotal) {
                setPaymentMethod(0);
            } else {
                setPaymentMethod(1);
            }
        }
    }, [wallet, isWalletLoading, isVoucherLoading, cartItems, selectedItemIds, grandTotal]);

    // Ensure PayOS is selected if wallet balance becomes insufficient (e.g. after quantity change or voucher toggle)
    useEffect(() => {
        if (paymentMethod === 0 && wallet !== undefined && wallet.balance < grandTotal) {
            setPaymentMethod(1);
        }
    }, [wallet, grandTotal, paymentMethod]);

    const queryClient = useQueryClient();

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
            const errorMsg = error.response?.data?.message || error.message || "Có lỗi xảy ra khi thanh toán.";
            alert(errorMsg);
            
            // If it's the voucher changed error, refresh the fund and toggle off
            if (errorMsg.includes("Số dư voucher đã thay đổi") || errorMsg.includes("voucher")) {
                queryClient.invalidateQueries({ queryKey: ["voucher-fund"] });
                setApplyVoucher(false);
            }
        },
    });

    if (isCartLoading || isWalletLoading || isVoucherLoading) return <div className="p-8 text-center">Đang tải...</div>;

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
            cancelUrl: `${window.location.origin}/checkout/cancel`,
            applyVoucherAmount: voucherDiscount > 0 ? voucherDiscount : undefined
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
        if (paymentMethod === 0 && wallet && wallet.balance < grandTotal) {
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

    const minExpiryTime = checkoutItems.reduce((min, item) => {
        const expiry = new Date(item.expiryDate);
        return expiry < min ? expiry : min;
    }, new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000));

    // Limit max to tomorrow at 21:00
    const maxDateLimit = new Date();
    maxDateLimit.setDate(maxDateLimit.getDate() + 1);
    maxDateLimit.setHours(21, 0, 0, 0);

    const effectiveMaxPickupTime = minExpiryTime < maxDateLimit ? minExpiryTime : maxDateLimit;
    const timeOptions: Date[] = [];

    // Bắt đầu từ mốc tròn giờ tiếp theo (ví dụ 14:15 -> 15:00)
    let currentOption = new Date(now.getTime());
    currentOption.setHours(currentOption.getHours() + 1, 0, 0, 0);

    while (currentOption <= effectiveMaxPickupTime) {
        const hours = currentOption.getHours();
        const minutes = currentOption.getMinutes();
        const timeVal = hours + minutes / 60;
        
        // Only allow pickup between 08:00 and 21:00
        if (timeVal >= 8 && timeVal <= 21) {
            timeOptions.push(new Date(currentOption));
        }
        
        currentOption.setHours(currentOption.getHours() + 1);
    }

    if (timeOptions.length === 0 && minExpiryTime > now) {
        timeOptions.push(minExpiryTime);
    }

    // Set default selection
    if (!expectedPickupTime && timeOptions.length > 0) {
        setExpectedPickupTime(timeOptions[0].toISOString());
    }

    return (
        <div className="max-w-screen-2xl mx-auto px-4 xl:px-8 py-8">
            <h1 className="text-2xl font-bold mb-8">Thanh toán</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Cột 1: Danh sách sản phẩm */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">1. Đơn hàng của bạn</h2>
                        <div className="space-y-4">
                            {Object.values(groupedItems).map((group, idx) => (
                                <div key={idx} className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-semibold text-gray-700 mb-4 border-b pb-2">Từ: {group.storeName}</h3>
                                    <div className="space-y-4">
                                        {group.items.map((item) => (
                                            <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                                                <Link to={ROUTES.PRODUCT_DETAIL(item.listingId)} className="block shrink-0 hover:opacity-80 transition-opacity">
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={item.title}
                                                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                                                    />
                                                </Link>
                                                <div className="flex-1 min-w-0">
                                                    <Link to={ROUTES.PRODUCT_DETAIL(item.listingId)} className="font-medium text-gray-900 truncate hover:text-brand-500 transition-colors inline-block">
                                                        {item.title}
                                                    </Link>
                                                    <p className="text-sm text-gray-500 mt-1">Số lượng: {item.quantity}</p>
                                                    <p className="text-brand-600 font-semibold mt-2">
                                                        {(item.salePrice * item.quantity).toLocaleString("vi-VN")} đ
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cột 2: Thời gian và Thanh toán */}
                <div className="space-y-6">
                    {/* Thời gian nhận hàng */}
                    <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-3">2. Thời gian lấy hàng</h2>
                        <div className="text-sm mb-4 space-y-1.5">
                            <p className="text-gray-500">
                                Vui lòng chọn thời gian bạn sẽ đến lấy. Các món ăn sắp hết hạn cần được lấy sớm để đảm bảo chất lượng.
                            </p>
                            <p className="text-amber-600 font-medium">
                                * Lưu ý: Nếu đến muộn hơn thời gian đã chọn, cửa hàng có quyền hủy đơn và bạn sẽ không được hoàn tiền.
                            </p>
                        </div>
                        <div className="space-y-4 mt-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {(() => {
                                const groups: Record<string, Date[]> = {};
                                timeOptions.forEach(time => {
                                    const today = new Date();
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    
                                    let groupName = "";
                                    if (time.getDate() === today.getDate() && time.getMonth() === today.getMonth() && time.getFullYear() === today.getFullYear()) {
                                        groupName = "Hôm nay";
                                    } else if (time.getDate() === tomorrow.getDate() && time.getMonth() === tomorrow.getMonth() && time.getFullYear() === tomorrow.getFullYear()) {
                                        groupName = "Ngày mai";
                                    } else {
                                        groupName = time.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' });
                                    }
                                    
                                    if (!groups[groupName]) groups[groupName] = [];
                                    groups[groupName].push(time);
                                });

                                return Object.entries(groups).map(([groupName, groupTimes]) => (
                                    <div key={groupName} className="space-y-2">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 bg-white py-1">{groupName}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {groupTimes.map((time, idx) => {
                                                const timeStr = time.toISOString();
                                                const isSelected = expectedPickupTime === timeStr;
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setExpectedPickupTime(timeStr)}
                                                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors border ${
                                                            isSelected 
                                                                ? 'bg-brand-500 text-white border-brand-500 shadow-sm' 
                                                                : 'bg-white text-gray-700 border-gray-200 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700'
                                                        }`}
                                                    >
                                                        {time.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* Thanh toán */}
                    <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                        <h2 className="text-lg font-semibold mb-3">3. Thanh toán</h2>
                        
                        {/* Mới: Toggle sử dụng Voucher */}
                        {availableVoucher > 0 && (
                            <div className="mb-4 p-4 border border-brand-200 bg-brand-50 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
                                        <CoinsIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Quỹ Voucher SaveFood</p>
                                        <p className="text-sm text-gray-600">Khả dụng: <strong className="text-brand-600">{availableVoucher.toLocaleString("vi-VN")} đ</strong></p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={applyVoucher}
                                        onChange={(e) => setApplyVoucher(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                                </label>
                            </div>
                        )}

                        <div className="space-y-3 flex-1">
                            <label className={`flex flex-col p-4 border rounded-xl transition-colors ${wallet && wallet.balance < grandTotal ? 'bg-gray-50 border-gray-200 opacity-70 cursor-not-allowed' : paymentMethod === 0 ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500 cursor-pointer' : 'border-gray-200 cursor-pointer hover:border-brand-300'}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value={0}
                                            checked={paymentMethod === 0}
                                            onChange={() => setPaymentMethod(0)}
                                            disabled={wallet && wallet.balance < grandTotal}
                                            className="w-4 h-4 text-brand-500 focus:ring-brand-500 disabled:opacity-50"
                                        />
                                        <span className={`font-medium flex flex-wrap items-center gap-2 ${wallet && wallet.balance < grandTotal ? 'text-gray-500' : 'text-gray-900'}`}>
                                            Ví SaveFood
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                                                <ShieldCheckIcon className="w-3 h-3" /> Guarantee
                                            </span>
                                        </span>
                                    </div>
                                    <span className={`text-sm font-semibold sm:text-right ${wallet && wallet.balance < grandTotal ? 'text-gray-500' : 'text-gray-900'} ml-7 sm:ml-0`}>
                                        Số dư: {wallet?.balance.toLocaleString("vi-VN")} đ
                                    </span>
                                </div>
                                
                                {wallet && wallet.balance < grandTotal ? (
                                    <div className="mt-2 ml-7 text-xs sm:text-sm text-red-500 font-medium">
                                        Không đủ số dư để thanh toán.
                                    </div>
                                ) : paymentMethod === 0 && (
                                    <div className="mt-2 ml-7 text-xs sm:text-sm text-gray-600">
                                        Hoàn tiền 100% lập tức nếu bị từ chối đơn.
                                    </div>
                                )}
                            </label>

                            <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 1 ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500' : 'border-gray-200 hover:border-brand-300'}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value={1}
                                        checked={paymentMethod === 1}
                                        onChange={() => setPaymentMethod(1)}
                                        className="w-4 h-4 text-brand-500 focus:ring-brand-500"
                                    />
                                    <span className="font-medium text-gray-900">PayOS (Chuyển khoản / QR)</span>
                                </div>
                                {paymentMethod === 1 && (
                                    <div className="mt-2 ml-7 text-xs sm:text-sm text-gray-500">
                                        Hỗ trợ mọi ngân hàng 24/7.
                                    </div>
                                )}
                            </label>
                        </div>
                        <p className="mt-4 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                            * Yêu cầu thanh toán trước để giữ món. Đơn sẽ bị huỷ nếu không thanh toán kịp thời.
                        </p>
                    </div>
                </div>

                {/* Cột 3: Tổng cộng / Sticky */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-24">
                        <h2 className="text-lg font-semibold mb-4">Tổng cộng</h2>
                        <div className="flex justify-between mb-2">
                            <span>Tạm tính</span>
                            <span>{totalAmount.toLocaleString("vi-VN")} đ</span>
                        </div>
                        {applyVoucher && voucherDiscount > 0 && (
                            <div className="flex justify-between mb-2 text-green-600 font-medium">
                                <span>Giảm giá Voucher</span>
                                <span>-{voucherDiscount.toLocaleString("vi-VN")} đ</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t pt-4 mt-4">
                            <span>Tổng tiền</span>
                            <span className="text-brand-600">{grandTotal.toLocaleString("vi-VN")} đ</span>
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
                            disabled={checkoutMutation.isPending || !agreedToPolicy || (paymentMethod === 0 && (wallet?.balance || 0) < grandTotal)}
                            className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {checkoutMutation.isPending 
                                ? "Đang xử lý..." 
                                : grandTotal === 0 
                                    ? "Xác nhận đơn (Miễn phí)" 
                                    : "Xác nhận thanh toán"}
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
