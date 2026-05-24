using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Admin;

namespace SaveFoodBackend.Interfaces
{
    public interface IAdminService
    {
        Task<IEnumerable<AdminUserListDTO>> GetUsersAsync();
        Task<AdminUserDetailsDTO> GetUserDetailsAsync(Guid userId);
        Task UpdateUserStatusAsync(Guid userId, byte newStatus);
        
        Task<IEnumerable<AdminStoreApprovalDTO>> GetPendingStoresAsync();
        Task ApproveStoreAsync(Guid storeId);
        Task RejectStoreAsync(Guid storeId, RejectStoreRequest request);
    }
}
