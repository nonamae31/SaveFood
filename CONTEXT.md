# SaveFood Domain Context

This document captures the ubiquitous language used in the SaveFood project to ensure consistency between technical implementation and domain concepts.

## Language

**Category**:
A dynamic classification of food items (e.g., Bakery, Dairy) managed by Admins. Stores must select an active Category when creating a Product. Categories are soft-deleted (`IsDeleted`) rather than permanently removed to preserve historical product data.
_Avoid_: FoodCategory (as a static enum).

**Subscription Plan**:
A tier of service offered by the platform to stores, with a specific name, description, and monthly price (e.g., Basic, Premium).
_Avoid_: GÃ³i cÆ°á»›c (in code), Package, Tier.

**Store Subscription**:
The specific enrollment record of a store in a Subscription Plan, including start and end dates and its current status.
_Avoid_: User Subscription, Store Plan.

**Platform Fee**:
The 5% commission retained by the platform on each successfully completed and delivered Order. Orders that are cancelled, refunded, failed, or disputed do not generate a Platform Fee.
_Avoid_: Hoa há»“ng, Commission.

**Store Wallet**:
The virtual financial ledger for a store within the platform, tracking both `Available Balance` (funds ready to be withdrawn) and `Pending Balance` (funds from orders not yet fully cleared).
_Avoid_: Sá»‘ dÆ° shop, Account Balance.

**Withdrawal Request**:
A request made by a Store to transfer funds strictly from their `Available Balance` in the Store Wallet to their real-world bank account. Admins must manually transfer the funds via external bank applications before marking the request as 'Paid' in the system.
_Avoid_: Payout Request, Payout.

**Refund Request**:
A request handled by the platform to return money to a Customer for a failed, cancelled, or disputed order. The refund amount is deducted from the Store's `Pending Balance` (since the funds have not yet cleared) and credited instantly to the **Customer Wallet**. This ensures a smooth, fast refund experience without waiting for slow bank transfers.
_Avoid_: Store Refund, Bank Refund.

**Customer Wallet**:
A virtual financial ledger for a Customer, holding funds that were refunded from failed or cancelled orders. Customers can use this balance to pay for future orders or request a withdrawal to their bank account.
_Avoid_: Customer Balance.

**User**:
The core identity and login account for any individual accessing the platform. A User can have one or more system-level Roles (Admin, Store, Customer).
_Avoid_: Account.

**Store**:
A business entity on the platform that sells products. A Store is the canonical term used instead of Partner. Users can register as a Store to start selling.
_Avoid_: Partner, Đối tác.

**Staff Role**:
A specific permission level (`Owner=0`, `Staff=2`) that a User holds within a particular Store, stored in the `StoreStaff` table. This is distinct from the system-level Role (`UserRole`, which for all store personnel is `Store`). The Owner (0) has full dashboard capabilities. Staff (2) has a restricted set of capabilities: creating Clearance Listings and processing Pickup Checkout at the counter.
_Avoid_: Confusing "Staff" (StaffRole=2 specifically) with "store staff" (any member of StoreStaff). Manager (1) is not used.

**Pickup Checkout**:
The in-store process performed by a Staff member when a Customer arrives to collect their order. The Staff member looks up the Order using the Customer's Pickup Code, then either collects cash payment (for Cash orders) or confirms receipt (for pre-paid online orders), before marking the Order as ReadyForPickup. A second "Complete" action finalises the Order after goods are handed over.

**Trust Score**:
A rating system that tracks a Store's reliability, affected by successful orders (+), cancellations (-), refunds (-), and user reports for policy violations (e.g., bypassing platform payments). Influences ranking and visibility.

**Product**:
The catalog template or generic description of an item (e.g., "Bánh m? ng?t", category, barcode, original price). It is static and does not have an expiration date or sale price.
_Avoid_: S?n ph?m (in code), Item Template.

**Clearance Listing**:
A specific physical batch of a Product that is nearing its expiration date, offered for sale with a specific sale price, available quantity, and expiry date. A single Product can have multiple active Clearance Listings simultaneously. In the user interface, it may dynamically display urgency (e.g., increasing discount percentages and color shifts) as it approaches its expiry date.
_Avoid_: Tin đăng (in code), Sale Event, Batch.

**Surprise Bag**:
A special type of Product (IsSurpriseBag flag) that guarantees a certain original total value (OriginalPrice) without detailing its exact contents. It is sold as a "blind box" via a Clearance Listing.

**Cart**:
A persistent, server-side collection of `Clearance Listing`s that a Customer intends to purchase. A Cart can contain items from multiple Stores. However, upon Checkout, the Cart is split into multiple separate `Order`s (one per Store). Items in the Cart do not reserve `QuantityAvailable` until the moment of successful checkout.
_Avoid_: Basket.

**Discount Rule Template**:
A named reuse pattern: the full set of `ListingDiscountRule`s from a previous `Clearance Listing`, offered as a quick-load option when creating a new Listing. Stored implicitly — no separate table; sourced by querying historical Listings (including soft-deleted ones) of the same Store.
_Avoid_: Rule Preset, Discount Template (as a standalone entity).

**Sale Milestone**:
The next scheduled price-drop event for a `Clearance Listing`, computed server-side from its `ListingDiscountRule`s where `TriggerType = TimeBeforeExpiry`. Expressed as `NextMilestoneTime` (UTC datetime) and `NextMilestonePrice` (VND). Only one milestone — the nearest future one — is returned. Stock-based rules (`TriggerType = StockRemaining`) do not produce a Sale Milestone.
_Avoid_: Countdown Event, Price Trigger, Next Discount.

**Product Visibility**:
A toggleable flag (`IsHidden`) on a `Product` that hides it from the Store's internal product catalog. Distinct from soft-deletion (`IsDeleted`). A hidden Product can still have active Clearance Listings; a deleted Product cannot be targeted by new Listings and blocks its own deletion if active Listings exist.
_Avoid_: Product Status, Active/Inactive toggle.

**Product Review**:
An evaluation (1-5 stars, optional text and photos) left by a Customer for a specific `OrderItem` they successfully purchased. Because an `OrderItem` maps back to a `Clearance Listing` and its underlying `Product`, these reviews are displayed on future listings of the same `Product`. The `Store`'s overall rating is aggregated from all `Product Review`s left for its items.
_Avoid_: Store Review, Shop Rating.

**Customer Location**:
The geographical coordinates (Latitude and Longitude) representing where the Customer is currently located or wants their food delivered/searched. This is obtained via Browser Geolocation or manually picked via a map (e.g., LocationPickerMap), cached in LocalStorage for guests, and persisted in the `User` table for logged-in users. It is used to calculate the Haversine distance to Stores and filter listings by a specific radius.
_Avoid_: User Address (when referring strictly to coordinates).
