import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { ROUTES } from '@/lib/constants'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

// ─── Placeholder pages ────────────────────────────────────────────────────────
// TODO: Thay thế bằng các trang thật khi từng thành viên xây dựng tính năng của mình.
// Người 1: LoginPage, RegisterPage
// Người 2: StorePage, StoresPage  
// Người 3: ProductListPage, ProductDetailPage
// Người 4: CartPage, CheckoutPage, OrderDetailPage
// Người 5: PaymentReturnPage, AdminPage

function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-[--color-surface-subtle]">
      <Navbar />
      <div className="max-w-[--spacing-container] mx-auto px-4 sm:px-6 lg:px-8 py-[--spacing-section-y]">
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[--color-brand-100] mb-4">
            <span className="text-2xl" aria-hidden="true">🚧</span>
          </div>
          <h1 className="text-[--text-heading-xl] font-bold text-[--color-ink-primary] font-[--font-display] mb-2">
            {title}
          </h1>
          <p className="text-[--text-body-md] text-[--color-ink-secondary]">
            Trang này đang được phát triển. Sprint 0 hoàn thành — sẵn sàng nhận code từ nhóm!
          </p>
        </div>
      </div>
      <Footer />
    </main>
  )
}

// ─── App Component ────────────────────────────────────────────────────────────

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ── Public Pages ── */}
          <Route path={ROUTES.HOME}            element={<PlaceholderPage title="Trang chủ — SaveFood" />} />
          <Route path={ROUTES.PRODUCTS}        element={<PlaceholderPage title="Đồ ăn cận date" />} />
          <Route path="/products/:id"          element={<PlaceholderPage title="Chi tiết sản phẩm" />} />
          <Route path={ROUTES.STORES}          element={<PlaceholderPage title="Cửa hàng" />} />
          <Route path="/stores/:id"            element={<PlaceholderPage title="Chi tiết cửa hàng" />} />

          {/* ── Cart & Orders (Người 4) ── */}
          <Route path={ROUTES.CART}            element={<PlaceholderPage title="Giỏ hàng" />} />
          <Route path={ROUTES.CHECKOUT}        element={<PlaceholderPage title="Thanh toán" />} />
          <Route path={ROUTES.MY_ORDERS}       element={<PlaceholderPage title="Đơn hàng của tôi" />} />
          <Route path="/orders/:id"            element={<PlaceholderPage title="Chi tiết đơn hàng" />} />

          {/* ── Auth (Người 1) ── */}
          <Route path={ROUTES.LOGIN}           element={<PlaceholderPage title="Đăng nhập" />} />
          <Route path={ROUTES.REGISTER}        element={<PlaceholderPage title="Đăng ký" />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<PlaceholderPage title="Khôi phục mật khẩu" />} />

          {/* ── Store Dashboard (Người 2 & 3) ── */}
          <Route path={ROUTES.DASHBOARD}           element={<PlaceholderPage title="Dashboard" />} />
          <Route path={ROUTES.DASHBOARD_LISTINGS}  element={<PlaceholderPage title="Quản lý tin đăng" />} />
          <Route path={ROUTES.DASHBOARD_ORDERS}    element={<PlaceholderPage title="Đơn hàng" />} />
          <Route path={ROUTES.DASHBOARD_ANALYTICS} element={<PlaceholderPage title="Thống kê" />} />
          <Route path={ROUTES.DASHBOARD_SETTINGS}  element={<PlaceholderPage title="Cài đặt cửa hàng" />} />

          {/* ── Admin (Người 5) ── */}
          <Route path={ROUTES.ADMIN}           element={<PlaceholderPage title="Admin Portal" />} />

          {/* ── Payment Return (Người 5) ── */}
          <Route path="/payment/return"        element={<PlaceholderPage title="Kết quả thanh toán" />} />

          {/* ── 404 Fallback ── */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
