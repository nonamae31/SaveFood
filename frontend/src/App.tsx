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
import { CustomerProtectedRoute } from '@/components/layout/CustomerProtectedRoute'
import { StoreProtectedRoute } from '@/components/layout/StoreProtectedRoute'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import CategoryManagementPage from '@/pages/admin/CategoryManagementPage'
import { ProductListPage } from '@/pages/products/ProductListPage'
import { ProductDetailPage } from '@/pages/products/ProductDetailPage'
import { StoreListPage } from '@/pages/stores/StoreListPage'
import { StoreDetailPage } from '@/pages/stores/StoreDetailPage'
import StoreRegisterPage from '@/pages/stores/StoreRegisterPage'
import { PolicyPage } from '@/pages/policy/PolicyPage'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import DashboardProductsPage from '@/pages/dashboard/DashboardProductsPage'
import DashboardListingsPage from '@/pages/dashboard/DashboardListingsPage'

import DashboardSettingsPage from '@/pages/dashboard/DashboardSettingsPage'
import DashboardAnalyticsPage from '@/pages/dashboard/DashboardAnalyticsPage'
import DashboardOrdersPage from '@/pages/dashboard/DashboardOrdersPage'
import DashboardSubscriptionPage from '@/pages/dashboard/DashboardSubscriptionPage'
import DashboardPickupPage from '@/pages/dashboard/DashboardPickupPage'
import DashboardStaffPage from '@/pages/dashboard/DashboardStaffPage'
import DashboardWalletPage from '@/pages/dashboard/DashboardWalletPage'
import DashboardReviewsPage from '@/pages/dashboard/DashboardReviewsPage'

// ─── Placeholder pages ────────────────────────────────────────────────────────
// TODO: Thay thế bằng các trang thật khi từng thành viên xây dựng tính năng của mình.
// Người 1: LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
// Người 2: StorePage, StoresPage  
// Người 3: ProductListPage, ProductDetailPage
// Người 4: CartPage, CheckoutPage, OrderDetailPage
// Người 5: PaymentReturnPage, AdminPage
import { CartPage } from '@/pages/cart/CartPage'
import { CheckoutPage } from '@/pages/cart/CheckoutPage'
import { OrderDetailPage } from '@/pages/cart/OrderDetailPage'
import { MyOrdersPage } from '@/pages/cart/MyOrdersPage'
import { CustomerWalletPage } from '@/pages/profile/CustomerWalletPage'

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
          Chức năng này đang trong quá trình phát triển. Vui lòng quay lại sau!
        </p>
      </div>
    </div>
  )
}

// ─── App Component ────────────────────────────────────────────────────────────

import { AuthProvider } from '@/contexts/AuthContext'
import { LocationProvider } from '@/contexts/LocationContext'
import { ScrollToTop } from '@/components/layout/ScrollToTop'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocationProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* ── Public Pages ── */}
              <Route element={<MainLayout />}>
                <Route path={ROUTES.HOME}            element={<PlaceholderPage title="Trang chủ" />} />
                <Route path={ROUTES.PRODUCTS}        element={<PlaceholderPage title="Đồ ăn cận date" />} />
                <Route path="/products/:id"          element={<PlaceholderPage title="Chi tiết sản phẩm" />} />
                <Route path={ROUTES.STORES}          element={<StoreListPage />} />
                <Route path={ROUTES.STORE_REGISTER}  element={<StoreRegisterPage />} />
                <Route path={ROUTES.POLICY}          element={<PolicyPage />} />
                <Route path="/stores/:id"            element={<StoreDetailPage />} />

                {/* ── Protected Customer Routes ── */}
                <Route element={<CustomerProtectedRoute />}>
                  {/* ── Cart & Orders (Người 4) ── */}
                  <Route path={ROUTES.CART}            element={<CartPage />} />
                  <Route path={ROUTES.CHECKOUT}        element={<CheckoutPage />} />
                  <Route path="/checkout/success"      element={<OrderDetailPage />} />
                  <Route path="/checkout/cancel"       element={<OrderDetailPage />} />
                  <Route path={ROUTES.MY_ORDERS}       element={<MyOrdersPage />} />
                  <Route path="/orders/:id"            element={<OrderDetailPage />} />

                  {/* Profile nested in MainLayout for now */}
                  <Route path={ROUTES.PROFILE}         element={<ProfilePage />} />
                  <Route path={ROUTES.WISHLIST}        element={<PlaceholderPage title="Danh sách yêu thích" />} />
                  <Route path={ROUTES.MY_WALLET}       element={<PlaceholderPage title="Ví của tôi" />} />
                </Route>
              </Route>

            {/* ── Auth (Người 1) ── */}
            <Route path={ROUTES.LOGIN}           element={<LoginPage />} />
            <Route path={ROUTES.REGISTER}        element={<RegisterPage />} />
            <Route path={ROUTES.VERIFY_OTP}      element={<VerifyOtpPage />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
            <Route path={ROUTES.RESET_PASSWORD}  element={<ResetPasswordPage />} />

            {/* ── Store Dashboard (Người 2 & 3) ── */}
            <Route element={<StoreProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path={ROUTES.DASHBOARD}           element={<Navigate to={ROUTES.DASHBOARD_ANALYTICS} replace />} />
                <Route path={ROUTES.DASHBOARD_PRODUCTS}  element={<DashboardProductsPage />} />
                <Route path={ROUTES.DASHBOARD_LISTINGS}  element={<DashboardListingsPage />} />
                <Route path={ROUTES.DASHBOARD_ORDERS}    element={<PlaceholderPage title="Quản lý đơn hàng" />} />
                <Route path={ROUTES.DASHBOARD_ANALYTICS} element={<DashboardAnalyticsPage />} />
                <Route path={ROUTES.DASHBOARD_SETTINGS}  element={<DashboardSettingsPage />} />
                <Route path={ROUTES.DASHBOARD_SUBSCRIPTION} element={<DashboardSubscriptionPage />} />
                <Route path={ROUTES.DASHBOARD_PICKUP}    element={<PlaceholderPage title="Quản lý lấy hàng" />} />
                <Route path={ROUTES.DASHBOARD_STAFF}     element={<DashboardStaffPage />} />
                <Route path={ROUTES.DASHBOARD_WALLET}    element={<PlaceholderPage title="Ví cửa hàng" />} />
                <Route path={ROUTES.DASHBOARD_REVIEWS}   element={<PlaceholderPage title="Đánh giá cửa hàng" />} />
              </Route>
            </Route>

            {/* ── Admin (Người 5) ── */}
            <Route element={<AdminProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path={ROUTES.ADMIN} element={<Navigate to={ROUTES.ADMIN_ACCOUNTS} replace />} />
                <Route path={ROUTES.ADMIN_DASHBOARD} element={<PlaceholderPage title="Bảng điều khiển Admin" />} />
                <Route path={ROUTES.ADMIN_ACCOUNTS} element={<AccountManagementPage />} />
                <Route path={ROUTES.ADMIN_APPROVALS} element={<PlaceholderPage title="Phê duyệt cửa hàng" />} />
                <Route path={ROUTES.ADMIN_FINANCE} element={<PlaceholderPage title="Quản lý tài chính" />} />
                <Route path={ROUTES.ADMIN_SUBSCRIPTIONS} element={<PlaceholderPage title="Quản lý các gói dịch vụ" />} />
                <Route path={ROUTES.ADMIN_CATEGORIES} element={<PlaceholderPage title="Quản lý danh mục" />} />
              </Route>
            </Route>

            {/* ── Payment Return (Người 5) ── */}
            <Route path="/payment/return"        element={<PlaceholderPage title="Kết quả thanh toán" />} />

            {/* ── 404 Fallback ── */}
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
          </BrowserRouter>
        </LocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
