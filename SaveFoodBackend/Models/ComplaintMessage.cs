using System;

namespace SaveFoodBackend.Models;

public class ComplaintMessage
{
    public Guid Id { get; set; }
    public Guid ComplaintId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderRole { get; set; } = null!;
    public string Content { get; set; } = null!;
    public DateTime CreatedAt { get; set; }

    public virtual Complaint Complaint { get; set; } = null!;
    public virtual User Sender { get; set; } = null!;
}
