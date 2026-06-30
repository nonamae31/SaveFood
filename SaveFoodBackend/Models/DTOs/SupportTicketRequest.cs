using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.Models.DTOs
{
    public class SupportTicketRequest
    {
        [Required(ErrorMessage = "Tiêu đề không được để trống")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nội dung không được để trống")]
        public string Message { get; set; } = string.Empty;

        public IFormFile? Image { get; set; }
    }
}
