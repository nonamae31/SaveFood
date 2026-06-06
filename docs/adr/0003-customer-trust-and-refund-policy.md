# Customer and Store Trust Policy in Escrow Model

## Context
In ADR 0001, we established a Virtual Ledger (Wallet) architecture where the platform acts as an intermediary for payments. The user raised two concerns regarding trust: 
1. *How do we make customers trust the platform enough to hold their money before the store receives it?* 
2. *How do we protect stores from "no-shows" (bom hàng) since they are selling perishable food and the platform holds the money?*
Additionally, we needed to decide the exact flow for handling refunds when orders are cancelled, and whether it would be feasible to have customers pay stores directly.

## Decisions

1. **Reaffirm Centralized Escrow (PayOS)**: We reject the model where customers pay stores directly. Direct payments would make it difficult to collect the 5% platform fee and impossible to integrate online payment gateways (like PayOS) efficiently, as PayOS only supports a limited number of banks and store bank accounts vary wildly. The platform must be the sole recipient of initial payments.

2. **Customer Wallet for Instant Refunds**: To build trust and reduce friction, all refunds (due to cancellation or order failure) will be credited instantly to a **Customer Wallet** on the platform, rather than initiating a slow, manual, or costly bank transfer back to the customer's original account. Customers can use this wallet balance for future purchases or request a withdrawal.

3. **UI/UX "SaveFood Guarantee" Badge**: To address the psychological barrier at checkout, we will prominently display a "SaveFood Đảm Bảo" (SaveFood Guarantee) badge on the checkout screen. This will clearly communicate: *"Tiền của bạn được giữ an toàn và chỉ thanh toán cho quán khi bạn nhận được đồ ăn. Hoàn tiền 100% về ví ngay lập tức nếu đơn bị hủy" (Your money is held safely and only paid to the store upon receipt of food. 100% instant refund to wallet if cancelled).*

4. **Strict Store Protection against No-shows**: Because the platform holds the money and the food is perishable, stores face high risk if customers cancel at the last minute or fail to pick up. To protect stores:
   - Customers can only cancel (and receive a refund) when the order is in the "Pending" state.
   - Once the store marks the order as "Preparing" or "Accepted", the customer cannot cancel.
   - If the customer fails to pick up the order within the designated timeframe (no-show), the order is considered completed and the funds are transferred to the Store's Wallet. The customer loses their money.

## Consequences
- **Positive**: 
  - Solves the customer trust issue proactively at checkout.
  - Avoids the technical nightmare of multi-tenant direct bank integrations.
  - Instant refunds via Customer Wallet drastically improve customer satisfaction compared to waiting 1-3 business days for a bank refund.
  - **Stores are fully protected from malicious cancellations and no-shows, guaranteeing their revenue for prepared food.**
- **Negative**:
  - Requires the implementation of a Customer Wallet (in addition to the Store Wallet discussed in ADR 0001).
  - Requires UI updates to the checkout flow to highlight the guarantee.
