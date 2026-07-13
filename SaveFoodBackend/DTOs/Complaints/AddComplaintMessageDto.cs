using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Complaints;

public class AddComplaintMessageDto
{
    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = null!;
}
