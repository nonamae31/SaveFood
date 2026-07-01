using System;

namespace SaveFoodBackend.Models;

public partial class CustomerWalletTransaction
{
    public Guid Id { get; set; }
    public Guid CustomerWalletId { get; set; }
    public decimal Amount { get; set; }
    public byte Type { get; set; } // 0 = Deposit, 1 = Withdrawal, 2 = Payment, 3 = Refund
    public byte Status { get; set; } // 0 = Pending, 1 = Completed, 2 = Failed
    public Guid? OrderId { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }

    public virtual Order? Order { get; set; }
    public virtual CustomerWallet CustomerWallet { get; set; } = null!;
}
