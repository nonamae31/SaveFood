using System;

namespace SaveFoodBackend.Models;

public class CheckoutReservation
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ListingId { get; set; }
    public int Quantity { get; set; }
    public int PriorityScore { get; set; }
    public DateTime ExpiresAt { get; set; }

    public virtual User User { get; set; } = null!;
    public virtual ClearanceListing Listing { get; set; } = null!;
}
