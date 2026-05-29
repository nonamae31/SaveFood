using System;
using System.Collections.Generic;

namespace SaveFoodBackend.DTOs.Customer.Stores;

public class CustomerStoreDTO
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public double Rating { get; set; }
    public string Address { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public int PriorityLevel { get; set; }
    public bool HasFeaturedBadge { get; set; }
}
