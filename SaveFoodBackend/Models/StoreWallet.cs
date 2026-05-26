using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class StoreWallet
{
    public Guid Id { get; set; }

    public Guid StoreId { get; set; }

    public decimal AvailableBalance { get; set; }

    public decimal PendingBalance { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Store Store { get; set; } = null!;

    public virtual ICollection<WalletTransaction> WalletTransactions { get; set; } = new List<WalletTransaction>();
}
