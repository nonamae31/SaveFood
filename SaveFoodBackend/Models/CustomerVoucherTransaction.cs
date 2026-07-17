using System;

namespace SaveFoodBackend.Models;

/// <summary>
/// Ledger entry for each 2% voucher accrual event.
/// OrderId has a UNIQUE constraint in DB — serves as the idempotency key.
/// </summary>
public partial class CustomerVoucherTransaction
{
    public Guid Id { get; set; }
    public Guid CustomerVoucherFundId { get; set; }

    /// <summary>
    /// The order that triggered this accrual.
    /// DB-level UNIQUE constraint prevents double-accrual on the same order.
    /// </summary>
    public Guid OrderId { get; set; }

    /// <summary>2% of OrderTotal, rounded to nearest integer VND.</summary>
    public decimal Amount { get; set; }

    /// <summary>Snapshot of the order total at accrual time — for audit/recalculation.</summary>
    public decimal OrderTotal { get; set; }

    /// <summary>1=Credit, 2=Used, 3=Refunded</summary>
    public byte Type { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual CustomerVoucherFund Fund { get; set; } = null!;
    public virtual Order Order { get; set; } = null!;
}
