import { apiClient } from './client';

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

export const customerWalletApi = {
  getMyWallet: async () => {
    return await apiClient<CustomerWallet>('/customer/wallet');
  },
  
  getMyTransactions: async () => {
    return await apiClient<CustomerWalletTransaction[]>('/customer/wallet/transactions');
  },
  
  requestWithdraw: async (data: CustomerWithdrawRequest) => {
    return await apiClient<any>('/customer/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
