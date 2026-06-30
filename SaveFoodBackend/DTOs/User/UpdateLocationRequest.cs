using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.User
{
    public class UpdateLocationRequest
    {
        [Required]
        public decimal Latitude { get; set; }

        [Required]
        public decimal Longitude { get; set; }

        public string? Address { get; set; }
    }
}
