using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.DTOs.User
{
    public class UpdateProfileRequest
    {
        [Required(ErrorMessage = "Tên đầy đủ không được để trống")]
        [StringLength(150, ErrorMessage = "Tên đầy đủ không quá 150 ký tự")]
        public string FullName { get; set; } = null!;

        [StringLength(20, ErrorMessage = "Số điện thoại không quá 20 ký tự")]
        [RegularExpression(@"^(0[3|5|7|8|9])+([0-9]{8})$", ErrorMessage = "Số điện thoại không hợp lệ")]
        public string? PhoneNumber { get; set; }

        public IFormFile? AvatarFile { get; set; }

        public int? Gender { get; set; }
    }
}
