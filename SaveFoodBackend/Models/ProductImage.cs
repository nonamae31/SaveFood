using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class ProductImage
{
    public Guid Id { get; set; }

    public Guid ProductId { get; set; }

    public string ImageUrl { get; set; } = null!;

    public string? CloudinaryPublicId { get; set; }

    public byte ImageFlags { get; set; }

    public virtual Product Product { get; set; } = null!;
}
