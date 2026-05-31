import type { FoodCategory } from '@/types/product.types'

// ─── Constants: Query Keys, Routes, API Endpoints ──────────────────────────
// Mọi thành viên PHẢI dùng các constant này. KHÔNG hardcode string trực tiếp.

// ── React Query Keys ─────────────────────────────────────────────────────────
// Dùng để React Query identify cache. Phải nhất quán để invalidate cache đúng.

import type { ProductFilters, StoreFilters } from '@/types/api.types'

export const QUERY_KEYS = {
  products: {
    all:      (): readonly string[] => ['products'],
    list:     (filters: ProductFilters): readonly unknown[] => ['products', 'list', filters],
    detail:   (id: string): readonly string[] => ['products', 'detail', id],
    byStore:  (storeId: string): readonly string[] => ['products', 'byStore', storeId],
    expiring: (hours: number): readonly (string | number)[] => ['products', 'expiring', hours],
  },
  stores: {
    all:    (): readonly string[] => ['stores'],
    list:   (filters: StoreFilters): readonly unknown[] => ['stores', 'list', filters],
    detail: (id: string): readonly string[] => ['stores', 'detail', id],
    mine:   (): readonly string[] => ['stores', 'mine'],
  },
  orders: {
    all:    (): readonly string[] => ['orders'],
    myList: (): readonly string[] => ['orders', 'my'],
    detail: (id: string): readonly string[] => ['orders', 'detail', id],
    store:  (storeId: string): readonly string[] => ['orders', 'store', storeId],
    lookup: (storeId: string, code: string): readonly string[] => ['orders', 'lookup', storeId, code],
  },
  cart: {
    mine: (): readonly string[] => ['cart', 'mine'],
  },
  auth: {
    me: (): readonly string[] => ['auth', 'me'],
  },
  categories: {
    all:         (): readonly string[] => ['categories'],
    adminAll:    (): readonly string[] => ['categories', 'admin'],
  },
  storeFinance: {
    wallet: (): readonly string[] => ['storeFinance', 'wallet'],
    transactions: (page: number, size: number): readonly unknown[] => ['storeFinance', 'transactions', page, size],
    withdrawals: (page: number, size: number): readonly unknown[] => ['storeFinance', 'withdrawals', page, size],
  },
  reviews: {
    byStore: (storeId: string): readonly string[] => ['reviews', 'store', storeId],
  },
} as const

// ── Frontend Routes ───────────────────────────────────────────────────────────

export const ROUTES = {
  HOME:           '/',
  PRODUCTS:       '/products',
  PRODUCT_DETAIL: (id: string) => `/products/${id}`,
  STORE:          (id: string) => `/stores/${id}`,
  STORES:         '/stores',
  STORE_REGISTER: '/stores/register',
  CART:           '/cart',
  CHECKOUT:       '/checkout',
  ORDER_DETAIL:   (id: string) => `/orders/${id}`,
  MY_ORDERS:      '/my-orders',

  // Auth
  LOGIN:          '/login',
  REGISTER:       '/register',
  VERIFY_OTP:     '/verify-otp',
  FORGOT_PASSWORD:'/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PROFILE:        '/profile',
  WISHLIST:       '/wishlist',

  // Store Dashboard
  DASHBOARD:              '/dashboard',
  DASHBOARD_PRODUCTS:     '/dashboard/products',
  DASHBOARD_LISTINGS:     '/dashboard/listings',
  DASHBOARD_ORDERS:       '/dashboard/orders',
  DASHBOARD_ANALYTICS:    '/dashboard/analytics',
  DASHBOARD_SETTINGS:     '/dashboard/settings',
  DASHBOARD_SUBSCRIPTION: '/dashboard/subscription',
  DASHBOARD_PICKUP:       '/dashboard/pickup',
  DASHBOARD_STAFF:        '/dashboard/staff',
  DASHBOARD_WALLET:       '/dashboard/wallet',
  DASHBOARD_REVIEWS:      '/dashboard/reviews',

  // Admin
  ADMIN:               '/admin',
  ADMIN_DASHBOARD:     '/admin/dashboard',
  ADMIN_FINANCE:       '/admin/finance',
  ADMIN_ACCOUNTS:      '/admin/accounts',
  ADMIN_APPROVALS:     '/admin/approvals',
  ADMIN_SUBSCRIPTIONS: '/admin/subscriptions',
  ADMIN_CATEGORIES:    '/admin/categories',
} as const

// ── API Endpoints ─────────────────────────────────────────────────────────────
// Tập trung để khi Backend thay đổi URL chỉ cần sửa 1 chỗ.

export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER:  '/auth/register',
  AUTH_LOGIN:     '/auth/login',
  AUTH_REFRESH:   '/auth/refresh',
  AUTH_REVOKE:    '/auth/revoke',
  AUTH_ME:        '/auth/me',

  // Products (Clearance Listings)
  PRODUCTS:             '/products',
  PRODUCT_DETAIL:       (id: string) => `/products/${id}`,

  // Stores
  STORES:               '/stores',
  STORE_REGISTER:       '/stores/register',
  STORE_DETAIL:         (id: string) => `/stores/${id}`,
  MY_STORE:             '/stores/mine',

  // Store Finance
  STORE_FINANCE_WALLET:       '/store/finance/wallet',
  STORE_FINANCE_TRANSACTIONS: '/store/finance/transactions',
  STORE_FINANCE_WITHDRAWALS:  '/store/finance/withdrawals',

  // Store Reviews
  STORE_REVIEWS:              '/store/reviews',
  STORE_REVIEW_REPLY:         (reviewId: string) => `/store/reviews/${reviewId}/reply`,

  // Cart
  CART:                 '/cart',
  CART_ITEMS:           '/cart/items',
  CART_ITEM:            (id: string) => `/cart/items/${id}`,

  // Orders
  ORDERS:               '/orders',
  ORDER_DETAIL:         (id: string) => `/orders/${id}`,
  ORDER_STATUS:         (id: string) => `/orders/${id}/status`,

  // Payment
  PAYMENT_CREATE:       '/payment/create',
  PAYMENT_CALLBACK:     '/payment/vnpay-return',

  // Categories
  CATEGORIES:           '/categories',
  CATEGORIES_ADMIN_ALL: '/categories/all',
  CATEGORY:             (id: string) => `/categories/${id}`,
  CATEGORY_RESTORE:     (id: string) => `/categories/${id}/restore`,
} as const

// ── Pagination Defaults ───────────────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE:      1,
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE:     50,
} as const

// ── Local Storage Keys (lưu token) ───────────────────────────────────────────

export const STORAGE_KEYS = {
  ACCESS_TOKEN:  'sf_access_token',
  REFRESH_TOKEN: 'sf_refresh_token',
  USER:          'sf_user',
} as const

// ── Food Category Labels (tiếng Việt) ────────────────────────────────────────

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  'bakery':          'Bánh mì & Bánh ngọt',
  'dairy':           'Sữa & Sản phẩm sữa',
  'produce':         'Rau củ quả',
  'meat-seafood':    'Thịt & Hải sản',
  'prepared-meals':  'Đồ ăn sẵn',
  'beverages':       'Đồ uống',
  'pantry':          'Thực phẩm đóng gói',
  'frozen':          'Thực phẩm đông lạnh',
}
