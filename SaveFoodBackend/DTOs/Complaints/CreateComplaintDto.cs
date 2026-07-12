using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.DTOs.Complaints;

public class CreateComplaintDto
{
    [Required]
    public Guid StoreId { get; set; }

    public Guid? OrderId { get; set; }

    [Required]
    [MaxLength(255)]
    public string Title { get; set; } = null!;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = null!;

    [Required]
    public SaveFoodBackend.Models.Enums.ComplaintTypeEnum Type { get; set; }

    public List<CreateComplaintEvidenceDto> Evidences { get; set; } = new();
}

public class CreateComplaintEvidenceDto
{
    [Required]
    [MaxLength(500)]
    public string FileUrl { get; set; } = null!;

    [Required]
    [MaxLength(50)]
    public string FileType { get; set; } = null!;
}
