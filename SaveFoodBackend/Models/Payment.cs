using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;
//
public partial class Payment
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }

    public decimal Amount { get; set; }

    public DateTime? PaidAt { get; set; }

    public byte PaymentMethod { get; set; }

    public byte Status { get; set; }

    public DateTime CreatedAt { get; set; }

    // --- Bổ sung Audit Trail (PayOS) ---
    public string? PayOsReference { get; set; }

    public string? PayerAccountNumber { get; set; }

    public string? PayerName { get; set; }

    public string? PayerBankId { get; set; }

    public virtual Order Order { get; set; } = null!;
}
