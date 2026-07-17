import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/apiClient'

// ─── TanStack Query Client Configuration ────────────────────────────────────
// Cấu hình centralized cho React Query — staleTime, retry, error handling.
// Mọi thành viên import queryClient này, KHÔNG tạo QueryClient riêng.

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default staleTime là 0 để luôn gọi lại API ngầm (background refetch) khi mount component mới
      // hoặc chuyển tab. Các query cần cache lâu (như listings, categories) nên tự override staleTime riêng.
      staleTime: 0,

      // Cache giữ trong 10 phút sau khi component unmount
      gcTime: 10 * 60 * 1000,

      // Tự động retry tối đa 2 lần khi lỗi — KHÔNG retry cho lỗi 4xx
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false // Lỗi do người dùng → không retry
        }
        return failureCount < 2 // Lỗi mạng/server → retry tối đa 2 lần
      },

      // Delay trước khi retry (1s, 2s)
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),

      // Không refetch khi chuyển qua tab khác (tránh làm phiền người dùng)
      refetchOnWindowFocus: false,

      // Refetch khi reconnect mạng
      refetchOnReconnect: true,
    },
    mutations: {
      // Không retry mutation (tạo đơn hàng 2 lần là nguy hiểm)
      retry: false,

      // Log lỗi mutation ra console khi dev
      onError: (error) => {
        if (import.meta.env.DEV) {
          console.error('[Mutation Error]', error)
        }
      },
    },
  },
})
