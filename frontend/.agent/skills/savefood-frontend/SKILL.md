---
name: savefood-frontend
description: >
  Coding rules and system prompt for the SaveFood marketplace project — a React + TypeScript + Tailwind CSS + React Query web platform connecting food stores, restaurants, and supermarkets to sell near-expiry food at discounted prices. Trigger this skill whenever working on ANY SaveFood feature: UI components, pages, API hooks, TypeScript types, routing, state management, or design system tokens. This skill is MANDATORY for all SaveFood development tasks — do not write a single line of SaveFood code without consulting it first.
---

# SaveFood — AI Coding Agent Rules

> **MANDATORY COMPLIANCE**: Every code change in this project MUST follow these rules without exception. If a rule conflicts with a library's default behavior, the rule wins.

---

## 1. Project Overview

SaveFood is a **food waste reduction marketplace**. Stores list near-expiry food at discounted prices; buyers browse, filter, and purchase. The platform has two primary user personas:

- **Buyer**: Browse listings, filter by expiry window / location / category, purchase items.
- **Store Owner**: Dashboard to manage listings, track inventory, analytics.

**Tech Stack (non-negotiable):**
- React 18+ with TypeScript (strict mode)
- Tailwind CSS — **zero external UI component libraries** (shadcn, MUI, Radix UI components are BANNED except for unstyled primitives like `@radix-ui/react-dialog` for accessibility only)
- TanStack Query v5 (React Query) for all server state
- React Router v6 for routing
- Lucide React for icons ONLY
- Deployed on Vercel (no SSR unless explicitly added)

---

## 2. Design System — `tailwind.config.ts`

### 2.1 Color Palette

The SaveFood brand uses **earthy greens + warm ambers** — evoking freshness, sustainability, and urgency without alarm.

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand — fresh, sustainable green
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // primary action
          600: '#16a34a',  // hover state
          700: '#15803d',  // pressed/active
          800: '#166534',
          900: '#14532d',
        },
        // Urgency accent — near-expiry warning amber
        expiry: {
          fresh:   '#22c55e',  // > 3 days
          soon:    '#f59e0b',  // 1–3 days
          urgent:  '#ef4444',  // < 24 hours
          expired: '#9ca3af',  // expired (greyed out)
        },
        // Neutral surface palette
        surface: {
          base:    '#ffffff',
          subtle:  '#f9fafb',
          muted:   '#f3f4f6',
          border:  '#e5e7eb',
          strong:  '#111827',
        },
        // Text hierarchy
        ink: {
          primary:   '#111827',
          secondary: '#4b5563',
          tertiary:  '#9ca3af',
          inverse:   '#ffffff',
        },
      },
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Fraunces', 'serif'],  // for hero headings / store names
        mono:    ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Semantic scale — always use these, never raw sizes
        'display-2xl': ['4.5rem',  { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-xl':  ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg':  ['3rem',    { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        'heading-xl':  ['2rem',    { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-lg':  ['1.5rem',  { lineHeight: '1.3',  fontWeight: '600' }],
        'heading-md':  ['1.25rem', { lineHeight: '1.35', fontWeight: '600' }],
        'heading-sm':  ['1.125rem',{ lineHeight: '1.4',  fontWeight: '600' }],
        'body-lg':     ['1.125rem',{ lineHeight: '1.6' }],
        'body-md':     ['1rem',    { lineHeight: '1.6' }],
        'body-sm':     ['0.875rem',{ lineHeight: '1.5' }],
        'caption':     ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
      },
      spacing: {
        // Semantic spacing aliases
        'section-y':  '5rem',    // vertical padding between page sections
        'card-p':     '1.25rem', // card internal padding
        'container':  '80rem',   // max page width
      },
      borderRadius: {
        'card':   '1rem',
        'badge':  '9999px',
        'button': '0.625rem',
        'input':  '0.5rem',
      },
      boxShadow: {
        'card':         '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover':   '0 4px 12px rgba(0,0,0,0.08), 0 16px 32px rgba(0,0,0,0.08)',
        'dropdown':     '0 8px 24px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-in':       'fadeIn 0.2s ease-out',
        'slide-up':      'slideUp 0.3s ease-out',
        'pulse-expiry':  'pulseExpiry 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:      { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        pulseExpiry:  { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
}

export default config
```

### 2.2 Design Rules

- **NEVER** use raw Tailwind colors (`text-red-500`, `bg-blue-600`). Always use semantic tokens (`text-expiry-urgent`, `bg-brand-500`).
- **NEVER** use arbitrary values (`w-[347px]`) unless absolutely unavoidable for pixel-perfect image fitting. Document with a comment.
- Spacing follows an **8px base grid**. Prefer multiples of 2 (`.p-4 = 16px`, `.gap-6 = 24px`).
- Font size classes MUST come from the custom `fontSize` scale above.

---

## 3. Atomic Component System

> **LAW**: Every repeated UI pattern MUST become an atomic component. Hardcoding Tailwind classes more than once for the same visual element is FORBIDDEN.

### 3.1 Component Inventory (build ALL of these before building pages)

See `references/components.md` for full prop signatures and usage examples.

| Component | Path | Purpose |
|---|---|---|
| `<Button>` | `components/ui/Button.tsx` | All CTA / action buttons |
| `<Badge>` | `components/ui/Badge.tsx` | Category / status labels |
| `<ExpiryLabel>` | `components/ui/ExpiryLabel.tsx` | Time-remaining countdown chip |
| `<DiscountTag>` | `components/ui/DiscountTag.tsx` | "−40%" price reduction indicator |
| `<ProductCard>` | `components/products/ProductCard.tsx` | Core marketplace listing card |
| `<StoreCard>` | `components/stores/StoreCard.tsx` | Store preview card |
| `<SkeletonCard>` | `components/ui/SkeletonCard.tsx` | Loading placeholder (matches ProductCard) |
| `<Input>` | `components/ui/Input.tsx` | All text inputs with label + error |
| `<Select>` | `components/ui/Select.tsx` | All dropdowns |
| `<Modal>` | `components/ui/Modal.tsx` | Dialog wrapper (uses Radix Dialog primitive) |
| `<Avatar>` | `components/ui/Avatar.tsx` | User / store avatar with fallback |
| `<EmptyState>` | `components/ui/EmptyState.tsx` | Zero-results illustration + CTA |
| `<ErrorState>` | `components/ui/ErrorState.tsx` | Query error display + retry |
| `<PageHeader>` | `components/layout/PageHeader.tsx` | Consistent page title block |
| `<FilterBar>` | `components/products/FilterBar.tsx` | Category / expiry / price filter row |

### 3.2 Component Rules

1. **Single source of truth**: One component per visual pattern.
2. **Variant props, not duplicated components**: Use a `variant` prop (`variant: 'primary' | 'secondary' | 'ghost' | 'danger'`), not `<PrimaryButton>` and `<SecondaryButton>`.
3. **Never inline style overrides** from consuming components. If a new visual variant is needed, add it to the component's variant map.
4. **Accessibility first**: All interactive components must have `aria-*` attributes, keyboard navigation, and focus rings (`focus-visible:ring-2 focus-visible:ring-brand-500`).

---

## 4. Directory Structure

```
src/
├── api/                    # Pure async functions — NO React, NO hooks
│   ├── products.api.ts     # fetch/post/patch for products
│   ├── stores.api.ts       # fetch/post for stores
│   ├── orders.api.ts
│   ├── auth.api.ts
│   └── client.ts           # base fetch wrapper (headers, error handling, base URL)
│
├── hooks/                  # React Query hooks wrapping api/ functions
│   ├── useProducts.ts      # useProducts, useProductDetail, useInfiniteProducts
│   ├── useStores.ts        # useStore, useStoreListings
│   ├── useOrders.ts
│   ├── useAuth.ts
│   └── useMutations.ts     # useCreateListing, useUpdateListing, etc.
│
├── components/
│   ├── ui/                 # Pure atomic UI — zero business logic
│   ├── products/           # Product-domain components (ProductCard, FilterBar, etc.)
│   ├── stores/             # Store-domain components
│   ├── orders/             # Order-domain components
│   └── layout/             # Navbar, Footer, PageHeader, Sidebar
│
├── pages/
│   ├── HomePage.tsx
│   ├── ProductListPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── StorePage.tsx
│   ├── CheckoutPage.tsx
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx
│   │   ├── DashboardOverviewPage.tsx
│   │   ├── DashboardListingsPage.tsx
│   │   └── DashboardAnalyticsPage.tsx
│   └── auth/
│       ├── LoginPage.tsx
│       └── RegisterPage.tsx
│
├── types/
│   ├── product.types.ts
│   ├── store.types.ts
│   ├── order.types.ts
│   ├── user.types.ts
│   └── api.types.ts        # Generic API response shapes
│
├── lib/
│   ├── queryClient.ts      # TanStack Query client config
│   ├── formatters.ts       # Date, currency, expiry formatting utils
│   └── constants.ts        # QUERY_KEYS, ROUTES, API_ENDPOINTS
│
└── styles/
    └── globals.css         # @tailwind directives + custom base styles only
```

---

## 5. API Layer + React Query Conventions

### 5.1 API Layer (`src/api/`)

- Pure async functions. **No React imports. No hooks. No state.**
- Always typed: `Promise<T>` return types required.
- All errors thrown as `ApiError` (see `types/api.types.ts`).

```ts
// src/api/client.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiClient<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new ApiError(res.status, err.code ?? 'UNKNOWN', err.message ?? 'Request failed')
  }
  return res.json()
}
```

```ts
// src/api/products.api.ts
import { apiClient } from './client'
import type { Product, ProductsResponse } from '@/types/product.types'
import type { ProductFilters } from '@/types/api.types'

export const getProducts = (filters: ProductFilters): Promise<ProductsResponse> =>
  apiClient(`/products?${new URLSearchParams(filters as Record<string, string>)}`)

export const getProductById = (id: string): Promise<Product> =>
  apiClient(`/products/${id}`)

export const createListing = (data: CreateListingPayload): Promise<Product> =>
  apiClient('/products', { method: 'POST', body: JSON.stringify(data) })
```

### 5.2 React Query Hooks (`src/hooks/`)

- One hook file per domain. Hook names must be descriptive and match the query.
- **Always** define `queryKey` using `QUERY_KEYS` constants (never inline strings).
- Expose `data`, `isLoading`, `isError`, `error` — do NOT add local `useState` for server data.
- Use `select` to transform/derive data within the query.

```ts
// src/lib/constants.ts (query keys)
export const QUERY_KEYS = {
  products: {
    all:    () => ['products'] as const,
    list:   (filters: ProductFilters) => ['products', 'list', filters] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    byStore:(storeId: string) => ['products', 'byStore', storeId] as const,
    expiring:(windowHours: number) => ['products', 'expiring', windowHours] as const,
  },
  stores: {
    all:    () => ['stores'] as const,
    detail: (id: string) => ['stores', 'detail', id] as const,
  },
  orders: {
    my:     () => ['orders', 'my'] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
}
```

```ts
// src/hooks/useProducts.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { getProducts, getProductById } from '@/api/products.api'
import { QUERY_KEYS } from '@/lib/constants'
import type { ProductFilters } from '@/types/api.types'

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.products.list(filters),
    queryFn:  () => getProducts(filters),
    staleTime: 2 * 60 * 1000,  // 2 minutes — listings change frequently
  })
}

export function useProductDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.products.detail(id),
    queryFn:  () => getProductById(id),
    enabled:  !!id,
    staleTime: 60 * 1000,
  })
}

// Paginated listing for infinite scroll
export function useInfiniteProducts(filters: ProductFilters) {
  return useInfiniteQuery({
    queryKey:        QUERY_KEYS.products.list(filters),
    queryFn:         ({ pageParam = 1 }) => getProducts({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta.nextPage ?? undefined,
  })
}
```

### 5.3 Mutation Hooks

```ts
// src/hooks/useMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createListing, updateListing } from '@/api/products.api'
import { QUERY_KEYS } from '@/lib/constants'

export function useCreateListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.products.all() })
    },
  })
}
```

---

## 6. TypeScript Type Conventions

> **RULE**: All business types live in `src/types/`. No inline `type` or `interface` declarations inside component files unless it's purely local UI state.

### 6.1 Core Domain Types

```ts
// src/types/product.types.ts

/** Category of the food item */
export type FoodCategory =
  | 'bakery'
  | 'dairy'
  | 'produce'
  | 'meat-seafood'
  | 'prepared-meals'
  | 'beverages'
  | 'pantry'
  | 'frozen'

/** Urgency level derived from time-to-expiry */
export type ExpiryStatus = 'fresh' | 'soon' | 'urgent' | 'expired'

/** A single near-expiry product listing */
export interface Product {
  id:              string
  storeId:         string
  storeName:       string
  name:            string
  description:     string
  category:        FoodCategory
  imageUrls:       string[]
  originalPrice:   number          // in VND
  discountedPrice: number          // in VND
  discountPercent: number          // 0–100
  quantityLeft:    number
  expiresAt:       string          // ISO 8601 datetime
  expiryStatus:    ExpiryStatus    // computed by backend or derive on client
  isAvailable:     boolean
  createdAt:       string
  updatedAt:       string
}

export interface ProductsResponse {
  data: Product[]
  meta: PaginationMeta
}

export interface CreateListingPayload {
  name:            string
  description:     string
  category:        FoodCategory
  originalPrice:   number
  discountedPrice: number
  quantityLeft:    number
  expiresAt:       string
  imageUrls:       string[]
}

export type UpdateListingPayload = Partial<CreateListingPayload>
```

```ts
// src/types/store.types.ts

export type StoreCategory = 'restaurant' | 'supermarket' | 'bakery' | 'grocery' | 'cafe'

export interface Store {
  id:           string
  ownerId:      string
  name:         string
  description:  string
  category:     StoreCategory
  logoUrl:      string
  coverUrl:     string
  address:      StoreAddress
  rating:       number       // 0.0–5.0
  reviewCount:  number
  activeListings: number
  isVerified:   boolean
  operatingHours: OperatingHours
  createdAt:    string
}

export interface StoreAddress {
  street:   string
  district: string
  city:     string
  lat:      number
  lng:      number
}

export interface OperatingHours {
  [day: string]: { open: string; close: string } | null  // null = closed
}
```

```ts
// src/types/order.types.ts

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled'
  | 'expired'

export interface Order {
  id:          string
  buyerId:     string
  storeId:     string
  storeName:   string
  items:       OrderItem[]
  totalAmount: number         // in VND
  status:      OrderStatus
  pickupCode:  string | null  // revealed when ready_for_pickup
  pickupBy:    string         // ISO 8601 — latest pickup time
  createdAt:   string
  updatedAt:   string
}

export interface OrderItem {
  productId:   string
  productName: string
  quantity:    number
  priceAtTime: number         // snapshot price in VND
}
```

```ts
// src/types/api.types.ts

export interface PaginationMeta {
  page:       number
  pageSize:   number
  total:      number
  totalPages: number
  nextPage:   number | null
  prevPage:   number | null
}

export interface ApiError {
  status:  number
  code:    string
  message: string
}

/** Product list filter params — maps to URLSearchParams */
export interface ProductFilters {
  category?:       FoodCategory
  storeId?:        string
  expiryWithin?:   number        // hours, e.g. 24 = expires within 24h
  minDiscount?:    number        // percentage, e.g. 30 = at least 30% off
  maxPrice?:       number        // VND
  district?:       string
  search?:         string
  sortBy?:         'expiry' | 'discount' | 'price' | 'distance'
  sortOrder?:      'asc' | 'desc'
  page?:           number
  pageSize?:       number
}

export interface StoreFilters {
  category?:  StoreCategory
  district?:  string
  search?:    string
  verified?:  boolean
}
```

```ts
// src/types/user.types.ts

export type UserRole = 'buyer' | 'store_owner' | 'admin'

export interface User {
  id:        string
  email:     string
  fullName:  string
  avatarUrl: string | null
  role:      UserRole
  phone:     string | null
  createdAt: string
}

export interface AuthTokens {
  accessToken:  string
  refreshToken: string
  expiresAt:    number    // Unix timestamp
}
```

### 6.2 TypeScript Strict Rules

- Enable `"strict": true` in `tsconfig.json`. No exceptions.
- No `any`. Use `unknown` and narrow with type guards.
- No non-null assertions (`!`) except in test files.
- Prefer `interface` for object shapes, `type` for unions/aliases.
- Export types with named exports only. No default-exported types.
- Utility types over manual re-typing: `Pick<Product, 'id' | 'name'>` not a copy-pasted interface.

---

## 7. Page Consistency Rules

All pages MUST share these layout primitives — **visual inconsistency across pages is a bug, not a style preference.**

```tsx
// Every page wraps content like this:
<main className="min-h-screen bg-surface-subtle">
  <Navbar />
  <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-section-y">
    <PageHeader title="..." subtitle="..." />
    {/* page content */}
  </div>
  <Footer />
</main>
```

- **Loading state**: Always render `<SkeletonCard />` grid, never a spinner alone.
- **Error state**: Always render `<ErrorState error={error} onRetry={refetch} />`.
- **Empty state**: Always render `<EmptyState />` with context-specific messaging.
- **Transitions**: All pages use `animate-fade-in` on mount.

---

## 8. Formatter Utilities (Required)

```ts
// src/lib/formatters.ts

/** Format VND price — e.g. 45.000đ */
export const formatVND = (amount: number): string =>
  `${amount.toLocaleString('vi-VN')}đ`

/** Format discount — e.g. −40% */
export const formatDiscount = (pct: number): string => `−${pct}%`

/** Human-readable expiry countdown — e.g. "Còn 4 giờ", "Còn 2 ngày" */
export const formatExpiryCountdown = (expiresAt: string): string => {
  const diff = new Date(expiresAt).getTime() - Date.now()
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 1)    return 'Sắp hết hạn'
  if (hours < 24)   return `Còn ${hours} giờ`
  return `Còn ${Math.floor(hours / 24)} ngày`
}

/** Derive ExpiryStatus from ISO datetime string */
export const getExpiryStatus = (expiresAt: string): ExpiryStatus => {
  const hours = (new Date(expiresAt).getTime() - Date.now()) / 3_600_000
  if (hours < 0)   return 'expired'
  if (hours < 24)  return 'urgent'
  if (hours < 72)  return 'soon'
  return 'fresh'
}
```

---

## 9. ExpiryLabel Component (Core Pattern)

```tsx
// src/components/ui/ExpiryLabel.tsx
import { Clock } from 'lucide-react'
import { formatExpiryCountdown, getExpiryStatus } from '@/lib/formatters'
import type { ExpiryStatus } from '@/types/product.types'

const statusStyles: Record<ExpiryStatus, string> = {
  fresh:   'bg-brand-100   text-brand-700',
  soon:    'bg-amber-100   text-amber-700',
  urgent:  'bg-red-100     text-expiry-urgent animate-pulse-expiry',
  expired: 'bg-surface-muted text-ink-tertiary',
}

interface ExpiryLabelProps {
  expiresAt: string
  size?: 'sm' | 'md'
}

export function ExpiryLabel({ expiresAt, size = 'md' }: ExpiryLabelProps) {
  const status  = getExpiryStatus(expiresAt)
  const label   = formatExpiryCountdown(expiresAt)
  const classes = statusStyles[status]
  const textSize = size === 'sm' ? 'text-caption' : 'text-body-sm'

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-badge font-medium ${textSize} ${classes}`}>
      <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden />
      {label}
    </span>
  )
}
```

---

## 10. Prohibited Patterns (Zero Tolerance)

| ❌ Banned | ✅ Required Alternative |
|---|---|
| `import { Button } from '@mui/material'` | Custom `<Button>` from `components/ui/` |
| `className="text-red-500"` | `className="text-expiry-urgent"` |
| `useState` for server data | `useQuery` / `useMutation` |
| Inline fetch / axios calls in components | Hook from `hooks/` |
| Hardcoded strings like `"products"` in queryKey | `QUERY_KEYS.products.all()` |
| `any` type | Proper type or `unknown` + narrowing |
| Duplicated Tailwind class strings | Extract to atomic component |
| Direct DOM manipulation | React state / refs |
| `console.log` in committed code | Remove or use a logger utility |

---

## References

- `references/components.md` — Full prop signatures for all atomic components
- `references/pages.md` — Page-level layout specs and responsive breakpoints
