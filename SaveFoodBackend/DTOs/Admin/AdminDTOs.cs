using System;
using System.Collections.Generic;

namespace SaveFoodBackend.DTOs.Admin
{
    public class AdminUserListDTO
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public byte Status { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
        public DateTime CreatedAt { get; set; }
    }

    public class AdminUserDetailsDTO
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public byte Status { get; set; }
        public byte UserFlags { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
        public List<AdminStoreStaffInfoDTO> StoreAffiliations { get; set; } = new List<AdminStoreStaffInfoDTO>();
    }

    public class AdminStoreStaffInfoDTO
    {
        public Guid StoreId { get; set; }
        public string StoreName { get; set; } = null!;
        public string AddressLine { get; set; } = null!;
        public byte StoreStatus { get; set; }
        public byte StaffRole { get; set; } 
    }

    public class UpdateUserStatusRequest
    {
        public byte NewStatus { get; set; }
    }

    public class AdminStoreApprovalDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string AddressLine { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? OwnerName { get; set; }
        public string? OwnerEmail { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class RejectStoreRequest
    {
        public string ReviewNotes { get; set; } = null!;
    }
}
