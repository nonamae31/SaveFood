using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Customer.Orders;

public class VerifyPickupRequestDTO
{
    [Required]
    public string PickupCode { get; set; } = string.Empty;
}
