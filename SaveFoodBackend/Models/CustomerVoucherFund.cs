using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class CustomerVoucherFund
{
    public Guid Id { get; set; }

    /// <summary>Foreign key to the User (Customer).</summary>
    public Guid CustomerId { get; set; }

    /// <summary>
    /// Denormalized running total — updated atomically via ExecuteUpdateAsync.
    /// Represents the current usable balance.
    /// </summary>
    public decimal AccumulatedBalance { get; set; }

    /// <summary>
    /// Voucher amount currently held in pending orders (waiting for payment).
    /// </summary>
    public decimal ReservedAmount { get; set; } = 0;

    /// <summary>
    /// Monotonically increasing lifetime total earned.
    /// Never decreases on redemption (for stats / audit purposes).
    /// </summary>
    public decimal TotalEarned { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public virtual User Customer { get; set; } = null!;
    public virtual ICollection<CustomerVoucherTransaction> Transactions { get; set; } = new List<CustomerVoucherTransaction>();
}
