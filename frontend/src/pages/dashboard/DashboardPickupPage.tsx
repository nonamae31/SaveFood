import { useState, useRef, useEffect, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Html5Qrcode } from 'html5-qrcode'
import {
  ScanLine, Search, Camera, CameraOff, CheckCircle2, Clock,
  XCircle, Banknote, CreditCard, Package, User, Hash, AlertCircle, Loader2, Wallet, Smartphone
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { storeOrdersApi, type StoreOrderDTO } from '@/api/store.orders.api'
import { apiClient } from '@/api/client'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.round(amount))

const ORDER_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: 'Chờ xác nhận', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  1: { label: 'Đã xác nhận', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  2: { label: 'Chờ lấy hàng', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  3: { label: 'Hoàn thành', color: 'text-green-600 bg-green-50 border-green-200' },
  4: { label: 'Đã hủy', color: 'text-red-600 bg-red-50 border-red-200' },
  5: { label: 'Chờ khách xác nhận', color: 'text-orange-600 bg-orange-50 border-orange-200' },
} as const

const PAYMENT_METHOD = {
  0: { label: 'Ví SaveFood', icon: Wallet, color: 'text-brand-700 bg-brand-50' },
  1: { label: 'PayOS', icon: CreditCard, color: 'text-indigo-700 bg-indigo-50' },
} as const

// ─── QR Scanner Component ─────────────────────────────────────────────────────

const QR_READER_ID = 'sf-qr-reader'

interface QrScannerProps {
  onScan: (code: string) => void
  onClose: () => void
}

function QrScanner({ onScan, onClose }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [isStoppingUI, setIsStoppingUI] = useState(false)
  const isStoppingRef = useRef(false)

  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  }, [onScan, onClose]);

  const handleAction = async (action: (code?: string) => void, code?: string) => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    setIsStoppingUI(true);
    
    try {
      if (scannerRef.current) {
        // Cố gắng tắt camera an toàn
        await scannerRef.current.stop().catch(() => {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      action(code);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const scanner = new Html5Qrcode(QR_READER_ID)
    scannerRef.current = scanner

    const timeoutId = setTimeout(() => {
      if (!isMounted) return;
      
      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Remove pickupCode= if it exists (for old QR format)
          let code = decodedText.trim()
          const match = code.match(/pickupCode=([A-Z0-9]+)/i)
          if (match) {
            code = match[1].toUpperCase()
          } else if (code.length <= 10) {
            // For manual short codes
            code = code.toUpperCase()
          }
          if (isMounted) {
            handleAction((c) => onScanRef.current(c!), code)
          }
        },
        () => { /* ignore per-frame errors */ }
      ).catch((err) => {
        if (isMounted) {
          setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.')
          console.error(err)
        }
      })
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {}).finally(() => {
            try { scannerRef.current?.clear() } catch(e) {}
          });
        } catch (syncError) {
          try { scannerRef.current?.clear() } catch(e) {}
        }
      }
    }
  }, []) // Không truyền dep để tránh restart

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            {isStoppingUI ? <Loader2 className="w-5 h-5 text-[--color-brand-600] animate-spin" /> : <Camera className="w-5 h-5 text-[--color-brand-600]" />}
            {isStoppingUI ? 'Đang xử lý...' : 'Quét mã QR'}
          </div>
          <button
            onClick={() => handleAction(() => onCloseRef.current())}
            disabled={isStoppingUI}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer disabled:opacity-50"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner area */}
        <div className="p-5">
          {error ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CameraOff className="w-12 h-12 text-red-400" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : (
            <div className="relative bg-white">
              <div id={QR_READER_ID} className="rounded-xl overflow-hidden bg-white text-gray-900" />
              {/* Corner guides */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-[--color-brand-500] rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-[--color-brand-500] rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-[--color-brand-500] rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-[--color-brand-500] rounded-br-lg" />
              </div>
            </div>
          )}
          <p className="text-center text-xs text-gray-500 mt-3">
            Hướng camera vào mã QR của khách hàng
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Order Card ───────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: StoreOrderDTO
  storeId: string
  onActionComplete: () => void
  scanInProgress?: boolean
  scanError?: string | null
}

function OrderCard({ order, storeId, onActionComplete, scanInProgress, scanError }: OrderCardProps) {

  const statusInfo = ORDER_STATUS[order.orderStatus] ?? {
    label: 'Không rõ', color: 'text-gray-600 bg-gray-50 border-gray-200'
  }
  const payInfo = order.paymentMethod !== null && order.paymentMethod !== undefined
    ? PAYMENT_METHOD[order.paymentMethod as keyof typeof PAYMENT_METHOD]
    : null
  const PayIcon = payInfo?.icon ?? Banknote

  const isDone = order.orderStatus === 3
  const isCancelled = order.orderStatus === 4
  const isWaitingCustomer = order.orderStatus === 5
  const canBeVerified = order.orderStatus === 0 || order.orderStatus === 1 || order.orderStatus === 2

  const isPaid = order.paymentStatus === 1
  const isBlocked = (!isPaid && !isDone && !isCancelled && !isWaitingCustomer)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-mono font-semibold text-gray-700">
            {order.pickupCode ?? 'N/A'}
          </span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Customer info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[--color-brand-100] flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-[--color-brand-600]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
            <p className="text-xs text-gray-500">{order.customerEmail}</p>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-1.5">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="line-clamp-1">{item.productName}</span>
                <span className="text-gray-400">×{item.quantity}</span>
              </div>
              <span className="text-gray-600 font-medium shrink-0 ml-2">
                {formatVND(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-200" />

        {/* Total + payment method */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <PayIcon className="w-4 h-4" />
            <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${payInfo?.color ?? 'text-gray-600 bg-gray-100'}`}>
              {payInfo?.label ?? 'N/A'}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Tổng cộng</p>
            <p className="text-lg font-bold text-[--color-brand-700]">{formatVND(order.totalAmount)}</p>
          </div>
        </div>

        {/* Scan error */}
        {scanError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {scanError}
          </div>
        )}

        {/* Blocked message */}
        {isBlocked && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Đơn hàng này chưa được thanh toán trực tuyến. Nhân viên không nhận tiền mặt tại quầy. Yêu cầu khách hàng thanh toán qua ứng dụng trước.</p>
          </div>
        )}

        {/* Status messages — no manual action buttons */}
        <div className="pt-1">
          {isCancelled && (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium">
              <XCircle className="w-4 h-4" />
              Đơn hàng đã bị hủy
            </div>
          )}

          {isDone && (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 text-green-700 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Đơn hàng đã hoàn thành
            </div>
          )}

          {isWaitingCustomer && (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-50 text-orange-700 text-sm font-medium border border-orange-200">
              <Smartphone className="w-4 h-4" />
              Đã xác nhận — chờ khách hàng xác nhận trên ứng dụng
            </div>
          )}

          {canBeVerified && !isBlocked && (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 text-gray-500 text-sm font-medium border border-dashed border-gray-300">
              <Camera className="w-4 h-4" />
              {scanInProgress ? (
                <>Đang xác nhận... <Loader2 className="w-4 h-4 animate-spin" /></>
              ) : (
                <>Quét mã QR từ khách hàng để xác nhận giao hàng</>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPickupPage() {
  const { user } = useAuthContext()
  const storeId = user?.storeId ?? ''

  const [inputCode, setInputCode] = useState('')
  const [searchCode, setSearchCode] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [order, setOrder] = useState<StoreOrderDTO | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [scanVerifyError, setScanVerifyError] = useState<string | null>(null)
  const [isScanVerifying, setIsScanVerifying] = useState(false)
  const scannedCodeRef = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const lookupMutation = useMutation({
    mutationFn: (code: string) => storeOrdersApi.lookupByPickupCode(storeId, code),
    onSuccess: (data) => {
      setOrder(data)
      setLookupError(null)
      setScanVerifyError(null)

      // If lookup came from QR scan, auto-verify
      const scannedCode = scannedCodeRef.current
      if (scannedCode && data.pickupCode === scannedCode) {
        const canVerify = data.orderStatus === 0 || data.orderStatus === 1 || data.orderStatus === 2
        if (canVerify) {
          setIsScanVerifying(true)
          verifyAfterScanMutation.mutate({ orderId: data.id, pickupCode: data.pickupCode ?? '' })
        }
      }
    },
    onError: () => {
      setOrder(null)
      setLookupError('Không tìm thấy đơn hàng với mã này. Vui lòng kiểm tra lại.')
    },
  })

  const verifyAfterScanMutation = useMutation({
    mutationFn: (payload: { orderId: string; pickupCode: string }) =>
      apiClient(`/orders/${payload.orderId}/verify-pickup`, {
        method: 'POST',
        body: JSON.stringify({ pickupCode: payload.pickupCode }),
      }),
    onSuccess: () => {
      setIsScanVerifying(false)
      // Update local order status to 5
      setOrder((prev) => prev ? { ...prev, orderStatus: 5 } : prev)
    },
    onError: (e: Error) => {
      setIsScanVerifying(false)
      setScanVerifyError(e.message)
    },
  })

  const handleSearch = useCallback((code: string) => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setSearchCode(trimmed)
    setOrder(null)
    setLookupError(null)
    setScanVerifyError(null)
    scannedCodeRef.current = null // manual search, not from scan
    lookupMutation.mutate(trimmed)
  }, [lookupMutation])

  const handleScanSuccess = useCallback((code: string) => {
    setShowScanner(false)
    setInputCode(code)
    scannedCodeRef.current = code
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setSearchCode(trimmed)
    setOrder(null)
    setLookupError(null)
    setScanVerifyError(null)
    lookupMutation.mutate(trimmed)
  }, [lookupMutation])

  const handleReset = () => {
    setInputCode('')
    setSearchCode('')
    setOrder(null)
    setLookupError(null)
    setScanVerifyError(null)
    setIsScanVerifying(false)
    scannedCodeRef.current = null
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // Allow Enter key to trigger search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch(inputCode)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[--color-brand-100] flex items-center justify-center">
            <ScanLine className="w-5 h-5 text-[--color-brand-600]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nhận hàng tại quầy</h1>
            <p className="text-sm text-gray-500">Tìm đơn hàng bằng mã pickup hoặc quét QR</p>
          </div>
        </div>
      </div>

      {/* Search card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          Mã nhận hàng (Pickup Code)
        </label>

        <div className="flex flex-col gap-3">
          {/* Code input and Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="VD: AB12CD"
                maxLength={10}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-mono font-semibold tracking-widest text-gray-900 placeholder:text-gray-400 placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[--color-brand-400] focus:border-transparent transition-all"
                autoFocus
              />
            </div>
            <button
              onClick={() => handleSearch(inputCode)}
              disabled={!inputCode.trim() || lookupMutation.isPending}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-sm"
            >
              {lookupMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Search className="w-4 h-4" />
              }
              Tìm
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">hoặc</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          {/* Scan QR button */}
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[--color-brand-50] border border-[--color-brand-200] text-[--color-brand-700] hover:bg-[--color-brand-100] transition-all cursor-pointer font-semibold shadow-sm"
          >
            <Camera className="w-5 h-5" />
            Quét mã QR từ khách hàng
          </button>
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          Hỏi mã pickup của khách, hoặc quét mã QR từ app của họ
        </p>
      </div>

      {/* Error state */}
      {lookupError && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 animate-[fade-in_0.2s_ease]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Không tìm thấy đơn hàng</p>
            <p className="text-red-600/80 mt-0.5">{lookupError}</p>
          </div>
        </div>
      )}

      {/* Order result card */}
      {order && (
        <div className="animate-[fade-in_0.2s_ease]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">
              Kết quả cho mã <span className="font-mono text-[--color-brand-700]">{searchCode}</span>
            </p>
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer underline underline-offset-2"
            >
              Tìm đơn khác
            </button>
          </div>
          <OrderCard
            order={order}
            storeId={storeId}
            onActionComplete={() => {}}
            scanInProgress={isScanVerifying}
            scanError={scanVerifyError}
          />
        </div>
      )}

      {/* QR Scanner overlay */}
      {showScanner && (
        <QrScanner
          onScan={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
