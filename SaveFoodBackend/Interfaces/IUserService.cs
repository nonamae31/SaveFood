using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.DTOs.User;
using SaveFoodBackend.Models;

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
