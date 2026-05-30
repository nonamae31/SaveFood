using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public partial class Review
{
    public Guid Id { get; set; }

    public Guid OrderItemId { get; set; }

    public byte Rating { get; set; }

    public string? Comment { get; set; }

    public byte ReviewFlags { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? StoreReply { get; set; }

    public DateTime? StoreReplyAt { get; set; }

    public virtual OrderItem OrderItem { get; set; } = null!;

    public virtual ICollection<ReviewImage> ReviewImages { get; set; } = new List<ReviewImage>();
}
