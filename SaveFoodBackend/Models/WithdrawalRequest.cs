using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class WithdrawalRequest
{
    public Guid Id { get; set; }

    public Guid? StoreId { get; set; }

    public Guid? UserId { get; set; }

    public decimal Amount { get; set; }

    public byte Status { get; set; }

    public string BankName { get; set; } = null!;

    public string BankAccountNumber { get; set; } = null!;

    public string BankAccountName { get; set; } = null!;

    public string? AdminNote { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ProcessedAt { get; set; }

    public virtual Store? Store { get; set; }

    public virtual User? User { get; set; }
}
