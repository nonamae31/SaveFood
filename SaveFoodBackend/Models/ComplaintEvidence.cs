using System;

namespace SaveFoodBackend.Models;

public class ComplaintEvidence
{
    public Guid Id { get; set; }
    public Guid ComplaintId { get; set; }
    public string FileUrl { get; set; } = null!;
    public string FileType { get; set; } = null!;

    public virtual Complaint Complaint { get; set; } = null!;
}
