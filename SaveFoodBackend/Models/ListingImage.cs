using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class ListingImage
{
    public Guid Id { get; set; }

    public Guid ListingId { get; set; }

    public string ImageUrl { get; set; } = null!;

    public string? CloudinaryPublicId { get; set; }

    public byte ImageFlags { get; set; }

    public virtual ClearanceListing Listing { get; set; } = null!;
}
