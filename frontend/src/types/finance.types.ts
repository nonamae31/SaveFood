export interface StoreWallet {
  id: string;
  availableBalance: number;
  pendingBalance: number;
  updatedAt: string;
}

export type TransactionType = 1 | 2 | 3 | 4 | 5;
export type TransactionStatus = 0 | 1 | 2 | 3;
export type WithdrawalStatus = 0 | 1 | 2 | 3;

export interface WalletTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  orderId?: string | null;
  description?: string | null;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  adminNote?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

export interface CreateWithdrawalPayload {
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}
