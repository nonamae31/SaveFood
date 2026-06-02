import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { API_ENDPOINTS, QUERY_KEYS } from '@/lib/constants'
import type { PaginatedResponse } from '@/types/api.types'
import type { 
  StoreWallet, 
  WalletTransaction, 
  WithdrawalRequest, 
  CreateWithdrawalPayload 
} from '@/types/finance.types'

// Lấy thông tin ví
export function useStoreWallet() {
  return useQuery<StoreWallet>({
    queryKey: QUERY_KEYS.storeFinance.wallet(),
    queryFn: async () => {
      const data = await apiClient<StoreWallet>(API_ENDPOINTS.STORE_FINANCE_WALLET)
      return data
    },
  })
}

// Lấy danh sách giao dịch
export function useStoreTransactions(pageNumber: number = 1, pageSize: number = 10) {
  return useQuery<PaginatedResponse<WalletTransaction>>({
    queryKey: QUERY_KEYS.storeFinance.transactions(pageNumber, pageSize),
    queryFn: async () => {
      const data = await apiClient<PaginatedResponse<WalletTransaction>>(
        `${API_ENDPOINTS.STORE_FINANCE_TRANSACTIONS}?pageNumber=${pageNumber}&pageSize=${pageSize}`
      )
      return data
    },
  })
}

// Lấy danh sách yêu cầu rút tiền
export function useStoreWithdrawals(pageNumber: number = 1, pageSize: number = 10) {
  return useQuery<PaginatedResponse<WithdrawalRequest>>({
    queryKey: QUERY_KEYS.storeFinance.withdrawals(pageNumber, pageSize),
    queryFn: async () => {
      const data = await apiClient<PaginatedResponse<WithdrawalRequest>>(
        `${API_ENDPOINTS.STORE_FINANCE_WITHDRAWALS}?pageNumber=${pageNumber}&pageSize=${pageSize}`
      )
      return data
    },
  })
}

// Tạo yêu cầu rút tiền mới
export function useCreateWithdrawal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateWithdrawalPayload) => {
      const data = await apiClient<{ message: string }>(
        API_ENDPOINTS.STORE_FINANCE_WITHDRAWALS,
        {
          method: 'POST',
          body: JSON.stringify(payload)
        }
      )
      return data
    },
    onSuccess: () => {
      // Invalidate queries để refetch dữ liệu mới
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.storeFinance.wallet() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.storeFinance.transactions(1, 10) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.storeFinance.withdrawals(1, 10) })
    },
  })
}
