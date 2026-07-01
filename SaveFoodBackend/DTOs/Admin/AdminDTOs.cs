using System;
using System.Collections.Generic;

namespace SaveFoodBackend.DTOs.Admin
{
    public class GetUsersRequestDTO
    {
        public string? Search { get; set; }
        public string? RoleFilter { get; set; }
        public string? StatusFilter { get; set; }
        public string? SortBy { get; set; }
        public string? SortDirection { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 5;
        public byte? StaffRoleFilter { get; set; }
    }

    public class RoleInfoDTO
    {
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
    }

    public class AdminUserListDTO
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public byte Status { get; set; }
        public List<RoleInfoDTO> Roles { get; set; } = new List<RoleInfoDTO>();
        public DateTime CreatedAt { get; set; }
    }

    public class AdminUserDetailsDTO
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public byte Status { get; set; }
        public byte UserFlags { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<RoleInfoDTO> Roles { get; set; } = new List<RoleInfoDTO>();
        public List<AdminStoreStaffInfoDTO> StoreAffiliations { get; set; } = new List<AdminStoreStaffInfoDTO>();
    }

    public class AdminStoreStaffInfoDTO
    {
        public Guid StoreId { get; set; }
        public string StoreName { get; set; } = null!;
        public string DetailedAddress { get; set; } = null!;
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
        public string? ReferenceLink { get; set; }
        public string? StorefrontImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class RejectStoreRequest
    {
        public string ReviewNotes { get; set; } = null!;
    }

    public class AddUserRequestDTO
    {
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string RoleCode { get; set; } = null!;
    }

    public class AdminStoreListDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string AddressLine { get; set; } = null!;
        public string? OwnerName { get; set; }
        public string? OwnerEmail { get; set; }
        public byte Status { get; set; }
        public decimal AvailableBalance { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AdminStoreDetailsDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string AddressLine { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? Description { get; set; }
        public byte Status { get; set; }
        public string? StorefrontImageUrl { get; set; }
        public string? ReferenceLink { get; set; }
        public DateTime CreatedAt { get; set; }
        
        public string? OwnerName { get; set; }
        public string? OwnerEmail { get; set; }
        public string? OwnerPhone { get; set; }

        public decimal AvailableBalance { get; set; }
        public decimal PendingBalance { get; set; }

        public string? CurrentPlanName { get; set; }
        public DateTime? PlanExpiryDate { get; set; }
    }

    public class UpdateStoreStatusRequest
    {
        public byte NewStatus { get; set; }
    }
}
