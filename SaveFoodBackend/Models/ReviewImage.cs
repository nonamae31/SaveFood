using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class ReviewImage
{
    public Guid Id { get; set; }

    public Guid ReviewId { get; set; }

    public string ImageUrl { get; set; } = null!;

    public string? CloudinaryPublicId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Review Review { get; set; } = null!;
}
