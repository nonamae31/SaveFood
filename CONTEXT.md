# SaveFood Domain Context

This document captures the ubiquitous language used in the SaveFood project to ensure consistency between technical implementation and domain concepts.

## Language

**Subscription Plan**:
A tier of service offered by the platform to stores, with a specific name, description, and monthly price (e.g., Basic, Premium).
_Avoid_: Gói cước (in code), Package, Tier.

**Store Subscription**:
The specific enrollment record of a store in a Subscription Plan, including start and end dates and its current status.
_Avoid_: User Subscription, Store Plan.

**Platform Fee**:
The 5% commission retained by the platform on each successfully completed and delivered Order. Orders that are cancelled, refunded, failed, or disputed do not generate a Platform Fee.
_Avoid_: Hoa hồng, Commission.

**Store Wallet**:
The virtual financial ledger for a store within the platform, tracking both `Available Balance` (funds ready to be withdrawn) and `Pending Balance` (funds from orders not yet fully cleared).
_Avoid_: Số dư shop, Account Balance.

**Withdrawal Request**:
A request made by a Store to transfer funds strictly from their `Available Balance` in the Store Wallet to their real-world bank account. Admins must manually transfer the funds via external bank applications before marking the request as 'Paid' in the system.
_Avoid_: Payout Request, Payout.

**Refund Request**:
A request handled exclusively by the Admin to return money to a Customer for a failed, cancelled, or disputed order. The refund amount is deducted from the Store's `Pending Balance` (since the funds have not yet cleared). Admins must manually transfer funds to the customer's account externally before marking the request as 'Refunded' in the system.
_Avoid_: Store Refund.

**User**:
The core identity and login account for any individual accessing the platform. A User can have one or more system-level Roles (Admin, Store, Customer).
_Avoid_: Account.

**Staff Role**:
A specific permission level (Owner, Manager, Staff) that a User holds within a particular Store. This is distinct from their system-level Role.

**Trust Score**:
A rating system that tracks a Store's reliability, affected by successful orders (+), cancellations (-), refunds (-), and user reports for policy violations (e.g., bypassing platform payments). Influences ranking and visibility.

**Product**:
The catalog template or generic description of an item (e.g., "B�nh m? ng?t", category, barcode, original price). It is static and does not have an expiration date or sale price.
_Avoid_: S?n ph?m (in code), Item Template.

**Clearance Listing**:
A specific physical batch of a Product that is nearing its expiration date, offered for sale with a specific sale price, available quantity, and expiry date. A single Product can have multiple active Clearance Listings simultaneously.
_Avoid_: Tin ��ng (in code), Sale Event, Batch.

**Surprise Bag**:
A special type of Product (IsSurpriseBag flag) that guarantees a certain original total value (OriginalPrice) without detailing its exact contents. It is sold as a "blind box" via a Clearance Listing.
