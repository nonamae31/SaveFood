import { apiClient, ApiError } from './client';

export interface CustomerWallet {
  id: string;
  balance: number;
  updatedAt: string;
}

export interface CustomerWalletTransaction {
  id: string;
  amount: number;
  type: number; // 0 = Deposit, 1 = Withdrawal, 2 = Payment, 3 = Refund
  status: number; // 0 = Pending, 1 = Completed, 2 = Failed
  description?: string;
  createdAt: string;
  orderId?: string;
  orderCode?: number;
}

export interface CustomerWithdrawRequest {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface TopUpRequest {
  amount: number;
}

export interface TopUpResponse {
  checkoutUrl: string;
}

export const customerWalletApi = {
  getMyWallet: async (): Promise<CustomerWallet> => {
    return await apiClient<CustomerWallet>('/customer/wallet');
  },

  getMyTransactions: async (): Promise<CustomerWalletTransaction[]> => {
    return await apiClient<CustomerWalletTransaction[]>('/customer/wallet/transactions');
  },

  /**
   * Tạo PayOS payment link để nạp tiền.
   * - Nếu Idempotency-Key trùng (409): trả về checkoutUrl cũ để redirect luôn.
   */
  topUp: async (amount: number, idempotencyKey: string): Promise<TopUpResponse> => {
    try {
      return await apiClient<TopUpResponse>('/customer/wallet/top-up', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ amount }),
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // 409 từ idempotency: trả checkoutUrl cũ để FE redirect luôn
        const checkoutUrl = error.details?.checkoutUrl;
        if (checkoutUrl) return { checkoutUrl };
      }
      throw error;
    }
  },

  /**
   * Tạo yêu cầu rút tiền.
   * - Idempotency-Key chống double-submit.
   */
  requestWithdraw: async (data: CustomerWithdrawRequest, idempotencyKey: string): Promise<void> => {
    await apiClient<void>('/customer/wallet/withdraw', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(data),
    });
  },
};
