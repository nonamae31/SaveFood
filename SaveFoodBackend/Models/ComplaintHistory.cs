using System;

namespace SaveFoodBackend.Models;

public class ComplaintHistory
{
    public Guid Id { get; set; }
    public Guid ComplaintId { get; set; }
    public SaveFoodBackend.Models.Enums.ComplaintStatusEnum OldStatus { get; set; }
    public SaveFoodBackend.Models.Enums.ComplaintStatusEnum NewStatus { get; set; }
    public Guid ActionById { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }

    public virtual Complaint Complaint { get; set; } = null!;
    public virtual User ActionBy { get; set; } = null!;
}
