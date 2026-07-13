using System;
using System.Collections.Generic;

namespace SaveFoodBackend.Models;

public class Complaint
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public Guid StoreId { get; set; }
    public Guid? OrderId { get; set; }
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public SaveFoodBackend.Models.Enums.ComplaintStatusEnum Status { get; set; }
    public SaveFoodBackend.Models.Enums.ComplaintTypeEnum Type { get; set; }
    public bool IsStopRequested { get; set; } = false;
    public string? StopRequestedByRole { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public virtual User Customer { get; set; } = null!;
    public virtual Store Store { get; set; } = null!;
    public virtual Order? Order { get; set; }
    public virtual ICollection<ComplaintEvidence> ComplaintEvidences { get; set; } = new List<ComplaintEvidence>();
    public virtual ICollection<ComplaintHistory> ComplaintHistories { get; set; } = new List<ComplaintHistory>();
    public virtual ICollection<ComplaintMessage> ComplaintMessages { get; set; } = new List<ComplaintMessage>();
}
