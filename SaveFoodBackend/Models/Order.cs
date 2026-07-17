using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class Order
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid StoreId { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal VoucherDiscount { get; set; } = 0;

    public Guid? ConfirmedById { get; set; }

    public SaveFoodBackend.Models.Enums.OrderStatusEnum OrderStatus { get; set; }

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

    public virtual Store Store { get; set; } = null!;

    public virtual User User { get; set; } = null!;

    public virtual ICollection<WalletTransaction> WalletTransactions { get; set; } = new List<WalletTransaction>();

    public virtual ICollection<CustomerWalletTransaction> CustomerWalletTransactions { get; set; } = new List<CustomerWalletTransaction>();

    public virtual ICollection<Complaint> Complaints { get; set; } = new List<Complaint>();

    public bool CanConfirm()
    {
        return (DateTime.UtcNow - CreatedAt).TotalSeconds >= 10;
    }

    public bool CanCancel()
    {
        return OrderStatus == SaveFoodBackend.Models.Enums.OrderStatusEnum.Pending || OrderStatus == SaveFoodBackend.Models.Enums.OrderStatusEnum.Confirmed;
    }
}
