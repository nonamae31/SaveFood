using System;
using System.ComponentModel.DataAnnotations;

namespace SaveFoodBackend.DTOs.Store
{
    /// <summary>Payload để thêm một Staff mới vào cửa hàng.</summary>
    public class AddStoreStaffRequest
    {
        [Required(ErrorMessage = "Email là bắt buộc.")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
        public string Email { get; set; } = null!;
    }

    /// <summary>Thông tin một thành viên trong danh sách nhân viên cửa hàng.</summary>
    public class StoreStaffDTO
    {
        public Guid UserId { get; set; }
        public Guid StoreStaffId { get; set; }
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public byte StaffRole { get; set; }
        public string StaffRoleLabel { get; set; } = null!;
        public DateTime JoinedAt { get; set; }
    }
}
