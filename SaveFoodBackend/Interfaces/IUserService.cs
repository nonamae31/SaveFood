using System;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.User;

namespace SaveFoodBackend.Interfaces
{
    public interface IUserService
    {
        Task<UserProfileDTO> GetProfileAsync(Guid userId);
        Task UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
        Task UpdateLocationAsync(Guid userId, UpdateLocationRequest request);
        Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    }
}
