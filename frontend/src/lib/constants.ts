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
  },
  cart: {
    mine: (): readonly string[] => ['cart', 'mine'],
  },
  auth: {
    me: (): readonly string[] => ['auth', 'me'],
  },
} as const

// ── Frontend Routes ───────────────────────────────────────────────────────────

export const ROUTES = {
  HOME:           '/',
  PRODUCTS:       '/products',
  PRODUCT_DETAIL: (id: string) => `/products/${id}`,
  STORE:          (id: string) => `/stores/${id}`,
  STORES:         '/stores',
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
  DASHBOARD_LISTINGS:     '/dashboard/listings',
  DASHBOARD_ORDERS:       '/dashboard/orders',
  DASHBOARD_ANALYTICS:    '/dashboard/analytics',
  DASHBOARD_SETTINGS:     '/dashboard/settings',

  // Admin
  ADMIN:          '/admin',
  ADMIN_ACCOUNTS: '/admin/accounts',
  ADMIN_APPROVALS:'/admin/approvals',
  ADMIN_SUBSCRIPTIONS: '/admin/subscriptions',
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
  STORE_DETAIL:         (id: string) => `/stores/${id}`,
  MY_STORE:             '/stores/mine',

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
