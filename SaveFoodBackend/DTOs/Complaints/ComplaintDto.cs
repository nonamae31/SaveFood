using System;
using System.Collections.Generic;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.DTOs.Complaints;

public class ComplaintDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = null!;
    public string CustomerEmail { get; set; } = null!;
    public Guid StoreId { get; set; }
    public string StoreName { get; set; }
    public Guid? OrderId { get; set; }
    public Guid? ProductId { get; set; }
    public Guid? ListingId { get; set; }
    
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string Type { get; set; } = null!;
    public bool IsStopRequested { get; set; }
    public string? StopRequestedByRole { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<ComplaintEvidenceDto> Evidences { get; set; } = new();
}

public class ComplaintEvidenceDto
{
    public Guid Id { get; set; }
    public string FileUrl { get; set; } = null!;
    public string FileType { get; set; } = null!;
}

public class ComplaintDetailDto : ComplaintDto
{
    public List<ComplaintHistoryDto> Histories { get; set; } = new();
    public List<ComplaintMessageDto> Messages { get; set; } = new();
}

public class ComplaintHistoryDto
{
    public Guid Id { get; set; }
    public string OldStatus { get; set; } = null!;
    public string NewStatus { get; set; } = null!;
    public Guid ActionBy { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ComplaintMessageDto
{
    public Guid Id { get; set; }
    public Guid SenderId { get; set; }
    public string SenderRole { get; set; } = null!;
    public string SenderName { get; set; } = string.Empty;
    public string Content { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
