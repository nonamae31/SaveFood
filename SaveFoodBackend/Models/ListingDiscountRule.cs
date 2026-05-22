using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class ListingDiscountRule
{
    public Guid Id { get; set; }

    public Guid ListingId { get; set; }

    public int RuleOrder { get; set; }

    public decimal? DiscountPercent { get; set; }

    public decimal? TargetPrice { get; set; }

    public int TriggerValue { get; set; }

    public byte TriggerType { get; set; }

    public byte RuleFlags { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ClearanceListing Listing { get; set; } = null!;
}
