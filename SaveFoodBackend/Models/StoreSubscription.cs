using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class StoreSubscription
{
    public Guid Id { get; set; }

    public Guid StoreId { get; set; }

    public Guid PlanId { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public byte Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? OrderCode { get; set; }

    // PayOS Audit Fields
    public string? PayOsTransactionId { get; set; }

    public string? PayerAccountNumber { get; set; }

    public string? PayerName { get; set; }

    public string? PayerBankId { get; set; }

    public virtual SubscriptionPlan Plan { get; set; } = null!;

    public virtual Store Store { get; set; } = null!;
}
