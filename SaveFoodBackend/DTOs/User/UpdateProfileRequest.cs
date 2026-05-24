using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.User
{
    public class UpdateProfileRequest
    {
        [Required(ErrorMessage = "Tên đầy đủ không được để trống")]
        [StringLength(150, ErrorMessage = "Tên đầy đủ không quá 150 ký tự")]
        public string FullName { get; set; } = null!;

        [StringLength(20, ErrorMessage = "Số điện thoại không quá 20 ký tự")]
        public string? PhoneNumber { get; set; }

        [StringLength(300, ErrorMessage = "Địa chỉ không quá 300 ký tự")]
        public string? Address { get; set; }

        [StringLength(500, ErrorMessage = "Đường dẫn ảnh đại diện không hợp lệ")]
        public string? AvatarUrl { get; set; }
    }
}
