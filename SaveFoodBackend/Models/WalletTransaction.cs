using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class WalletTransaction
{
    public Guid Id { get; set; }

    public Guid StoreWalletId { get; set; }

    public decimal Amount { get; set; }

    public byte Type { get; set; }

    public byte Status { get; set; }

    public Guid? OrderId { get; set; }

    public Guid? ReferenceId { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Order? Order { get; set; }

    public virtual StoreWallet StoreWallet { get; set; } = null!;
}
