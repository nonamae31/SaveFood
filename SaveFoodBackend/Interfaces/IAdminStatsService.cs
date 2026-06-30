using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Admin;

namespace SaveFoodBackend.Interfaces;

public interface IAdminStatsService
{
    Task<AdminRevenueStatsResponse> GetRevenueStatsAsync();
    Task<AdminSubscriptionStatsResponse> GetSubscriptionStatsAsync();
}
