using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Common;

namespace SaveFoodBackend.Interfaces
{
    public interface IAdminService
    {
        Task<PaginatedList<AdminUserListDTO>> GetUsersAsync(GetUsersRequestDTO request);
        Task<AdminUserDetailsDTO> GetUserDetailsAsync(Guid userId);
        Task UpdateUserStatusAsync(Guid userId, byte newStatus);
        
        Task<IEnumerable<AdminStoreApprovalDTO>> GetPendingStoresAsync();
        Task ApproveStoreAsync(Guid storeId);
        Task RejectStoreAsync(Guid storeId, RejectStoreRequest request);
        Task AddUserAsync(AddUserRequestDTO request);

        Task<PaginatedList<AdminStoreListDTO>> GetStoresAsync(string? search, byte? status, int pageNumber, int pageSize);
        Task<AdminStoreDetailsDTO> GetStoreDetailsAsync(Guid storeId);
        Task UpdateStoreStatusAsync(Guid storeId, byte newStatus);
    }
}
