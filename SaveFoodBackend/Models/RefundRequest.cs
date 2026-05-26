using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class RefundRequest
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }

    public Guid RequestedBy { get; set; }

    public decimal Amount { get; set; }

    public string Reason { get; set; } = null!;

    public byte Status { get; set; }

    public string? AdminNote { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ProcessedAt { get; set; }

    public virtual Order Order { get; set; } = null!;

    public virtual User RequestedByNavigation { get; set; } = null!;
}
