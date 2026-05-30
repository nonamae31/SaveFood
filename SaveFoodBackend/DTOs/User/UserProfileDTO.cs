using System;
using System.Collections.Generic;

namespace SaveFoodBackend.DTOs.User
{
    public class UserProfileDTO
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? AvatarUrl { get; set; }
        
        // Trả về danh sách tên Role thay vì toàn bộ object Role
        public List<string> Roles { get; set; } = new List<string>();

        // Trạng thái mật khẩu
        public bool HasPassword { get; set; }

        // Mảng cho Cửa hàng
        public Guid? StoreId { get; set; }

        // Staff role trong store: 0=Owner, 1=Manager, 2=Staff, null=không thuộc store nào
        public byte? StaffRole { get; set; }

        public string Status { get; set; } = string.Empty;
    }
}
