using System.ComponentModel.DataAnnotations;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.DTOs.Complaints;

public class UpdateComplaintStatusDto
{
    [Required]
    public SaveFoodBackend.Models.Enums.ComplaintStatusEnum Status { get; set; }

    [MaxLength(1000)]
    public string? Note { get; set; }
}
