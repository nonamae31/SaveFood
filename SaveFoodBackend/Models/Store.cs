using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class Store
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string AddressLine { get; set; } = null!;

    public string? Ward { get; set; }

    public string District { get; set; } = null!;

    public string City { get; set; } = null!;

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public string? PhoneNumber { get; set; }

    public string? LogoUrl { get; set; }

    public byte Status { get; set; }

    public byte StoreFlags { get; set; }

    public DateTime CreatedAt { get; set; }

    public int TrustScore { get; set; }

    public string? ReviewNotes { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    public virtual ICollection<StoreStaff> StoreStaffs { get; set; } = new List<StoreStaff>();

    public virtual ICollection<StoreSubscription> StoreSubscriptions { get; set; } = new List<StoreSubscription>();

    public virtual StoreWallet? StoreWallet { get; set; }

    public virtual ICollection<WithdrawalRequest> WithdrawalRequests { get; set; } = new List<WithdrawalRequest>();
}
