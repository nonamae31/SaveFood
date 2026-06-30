using System;

namespace SaveFoodBackend.DTOs.Store.Listings;

public class ListingImageResponseDTO
{
    public Guid Id { get; set; }
    public string ImageUrl { get; set; } = null!;
}
