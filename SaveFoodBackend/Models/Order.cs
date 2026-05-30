using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class Order
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid StoreId { get; set; }

    public decimal TotalAmount { get; set; }

    public Guid? ConfirmedById { get; set; }

    public byte OrderStatus { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? PickupCode { get; set; }

    public long? OrderCode { get; set; }

    public DateTime? ReservationExpiresAt { get; set; }

    public DateTime? ExpectedPickupTime { get; set; }

    public DateTime? MaxPickupTime { get; set; }

    public bool AgreedToNoRefundPolicy { get; set; }

    public virtual User? ConfirmedBy { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual Payment? Payment { get; set; }

    public virtual ICollection<RefundRequest> RefundRequests { get; set; } = new List<RefundRequest>();

    public virtual Store Store { get; set; } = null!;

    public virtual User User { get; set; } = null!;

    public virtual ICollection<WalletTransaction> WalletTransactions { get; set; } = new List<WalletTransaction>();
}
