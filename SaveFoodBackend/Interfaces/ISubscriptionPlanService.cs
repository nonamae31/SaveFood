using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Admin;

namespace SaveFoodBackend.Interfaces
{
    public interface ISubscriptionPlanService
    {
        Task<IEnumerable<SubscriptionPlanDTO>> GetAllPlansAsync();
        Task<SubscriptionPlanDTO?> GetPlanByIdAsync(Guid id);
        Task<SubscriptionPlanDTO> CreatePlanAsync(CreateSubscriptionPlanRequest request);
        Task<SubscriptionPlanDTO> UpdatePlanAsync(Guid id, UpdateSubscriptionPlanRequest request);
        Task DeletePlanAsync(Guid id);
    }
}
