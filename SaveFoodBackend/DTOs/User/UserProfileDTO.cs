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
    }
}
