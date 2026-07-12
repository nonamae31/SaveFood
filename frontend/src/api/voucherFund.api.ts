import { apiClient } from './client';

export interface VoucherTransaction {
  id: string;
  orderId: string;
  orderCode?: string;
  amount: number;
  orderTotal: number;
  createdAt: string;
}

export interface VoucherFund {
  accumulatedBalance: number;
  availableBalance: number;
  totalEarned: number;
  totalTransactions: number;
  recentTransactions: VoucherTransaction[];
}

export const voucherFundApi = {
  getMyVoucherFund: async (): Promise<VoucherFund> => {
    return await apiClient<VoucherFund>('/customer/voucher-fund');
  },
};
