# Virtual Wallet and Trust Score Architecture

## Context
SaveFood functions as a marketplace connecting Stores and Customers. We needed to decide how to handle the flow of funds (Customer -> Platform -> Store) and how to mitigate fraud (e.g., Stores asking Customers to cancel the platform order and pay them directly). Originally, the system lacked a mechanism to hold funds and track a Store's balance, making it difficult to collect the 5% platform fee reliably and handle cancellations or refunds.

## Decision
We decided to adopt a **Virtual Ledger (Wallet)** architecture combined with a **Trust Score** system, similar to established marketplaces (e.g., Shopee, Grab).
1. **Wallet System**: The platform acts as the intermediary, holding the real funds. We will introduce `StoreWallet` and `WalletTransaction` to track virtual balances (Available and Pending).
2. **Payouts**: Stores cannot receive money instantly; they must submit a `WithdrawalRequest` to move funds from their Available Balance to their real bank account. Admin handles payouts manually.
3. **Refunds**: Customers can submit `RefundRequests`, which, when approved, debit the Store's wallet.
4. **Anti-Fraud (Trust Score)**: We will introduce a `Trust Score` for Stores. It increases with successful orders and decreases with cancellations, refunds, or reports of bypassing the platform. This score will influence the store's ranking and visibility, and can lead to automatic suspension.

## Consequences
- **Positive**: 
  - Prevents platform fee evasion.
  - Simplifies the calculation of platform revenue (just querying `WalletTransaction` for platform fees).
  - Gives the platform control over refunds and dispute resolutions.
- **Negative**:
  - Significantly increases backend complexity (requires strict ledger consistency and handling concurrent transactions).
  - Puts the operational burden of manual payouts and refund reviews on the Admin team.
