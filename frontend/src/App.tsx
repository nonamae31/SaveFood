import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { ROUTES } from '@/lib/constants'
import { MainLayout } from '@/components/layout/MainLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { HomePage } from '@/pages/home/HomePage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { VerifyOtpPage } from '@/pages/auth/VerifyOtpPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { WishlistPage } from '@/pages/profile/WishlistPage'
import AccountManagementPage from '@/pages/admin/AccountManagementPage'
import StoreApprovalPage from '@/pages/admin/StoreApprovalPage'
import SubscriptionManagementPage from '@/pages/admin/SubscriptionManagementPage'
import AdminFinancePage from '@/pages/admin/AdminFinancePage'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AdminProtectedRoute } from '@/components/layout/AdminProtectedRoute'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import CategoryManagementPage from '@/pages/admin/CategoryManagementPage'
import { ProductListPage } from '@/pages/products/ProductListPage'
import { ProductDetailPage } from '@/pages/products/ProductDetailPage'
import { StoreListPage } from '@/pages/stores/StoreListPage'
import { StoreDetailPage } from '@/pages/stores/StoreDetailPage'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import DashboardProductsPage from '@/pages/dashboard/DashboardProductsPage'
import DashboardListingsPage from '@/pages/dashboard/DashboardListingsPage'

// ─── Placeholder pages ────────────────────────────────────────────────────────
// TODO: Thay thế bằng các trang thật khi từng thành viên xây dựng tính năng của mình.
// Người 1: LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
// Người 2: StorePage, StoresPage  
// Người 3: ProductListPage, ProductDetailPage
// Người 4: CartPage, CheckoutPage, OrderDetailPage
// Người 5: PaymentReturnPage, AdminPage

function PlaceholderPage({ title }: { title: string }) {
  return (
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
  )
}

// ─── App Component ────────────────────────────────────────────────────────────

import { AuthProvider } from '@/contexts/AuthContext'
import { ScrollToTop } from '@/components/layout/ScrollToTop'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* ── Public Pages ── */}
            <Route element={<MainLayout />}>
              <Route path={ROUTES.HOME}            element={<HomePage />} />
              <Route path={ROUTES.PRODUCTS}        element={<ProductListPage />} />
              <Route path="/products/:id"          element={<ProductDetailPage />} />
              <Route path={ROUTES.STORES}          element={<StoreListPage />} />
              <Route path="/stores/:id"            element={<StoreDetailPage />} />

              {/* ── Cart & Orders (Người 4) ── */}
              <Route path={ROUTES.CART}            element={<PlaceholderPage title="Giỏ hàng" />} />
              <Route path={ROUTES.CHECKOUT}        element={<PlaceholderPage title="Thanh toán" />} />
              <Route path={ROUTES.MY_ORDERS}       element={<PlaceholderPage title="Đơn hàng của tôi" />} />
              <Route path="/orders/:id"            element={<PlaceholderPage title="Chi tiết đơn hàng" />} />

              {/* Profile nested in MainLayout for now */}
              <Route path={ROUTES.PROFILE}         element={<ProfilePage />} />
              <Route path={ROUTES.WISHLIST}        element={<WishlistPage />} />
            </Route>

            {/* ── Auth (Người 1) ── */}
            <Route path={ROUTES.LOGIN}           element={<LoginPage />} />
            <Route path={ROUTES.REGISTER}        element={<RegisterPage />} />
            <Route path={ROUTES.VERIFY_OTP}      element={<VerifyOtpPage />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
            <Route path={ROUTES.RESET_PASSWORD}  element={<ResetPasswordPage />} />

            {/* ── Store Dashboard (Người 2 & 3) ── */}
            <Route element={<DashboardLayout />}>
              <Route path={ROUTES.DASHBOARD}           element={<PlaceholderPage title="Dashboard" />} />
              <Route path={ROUTES.DASHBOARD_PRODUCTS}  element={<DashboardProductsPage />} />
              <Route path={ROUTES.DASHBOARD_LISTINGS}  element={<DashboardListingsPage />} />
              <Route path={ROUTES.DASHBOARD_ORDERS}    element={<PlaceholderPage title="Đơn hàng" />} />
              <Route path={ROUTES.DASHBOARD_ANALYTICS} element={<PlaceholderPage title="Thống kê" />} />
              <Route path={ROUTES.DASHBOARD_SETTINGS}  element={<PlaceholderPage title="Cài đặt cửa hàng" />} />
            </Route>

            {/* ── Admin (Người 5) ── */}
            <Route element={<AdminProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path={ROUTES.ADMIN} element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
                <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
                <Route path={ROUTES.ADMIN_ACCOUNTS} element={<AccountManagementPage />} />
                <Route path={ROUTES.ADMIN_APPROVALS} element={<StoreApprovalPage />} />
                <Route path={ROUTES.ADMIN_FINANCE} element={<AdminFinancePage />} />
                <Route path={ROUTES.ADMIN_SUBSCRIPTIONS} element={<SubscriptionManagementPage />} />
                <Route path={ROUTES.ADMIN_CATEGORIES} element={<CategoryManagementPage />} />
              </Route>
            </Route>

            {/* ── Payment Return (Người 5) ── */}
            <Route path="/payment/return"        element={<PlaceholderPage title="Kết quả thanh toán" />} />

            {/* ── 404 Fallback ── */}
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
