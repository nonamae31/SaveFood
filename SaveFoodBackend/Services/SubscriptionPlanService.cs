using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Services
{
    public class SubscriptionPlanService : ISubscriptionPlanService
    {
        private readonly ISubscriptionRepository _subscriptionRepo;
        private readonly IRedisService _redisService;

        public SubscriptionPlanService(ISubscriptionRepository subscriptionRepo, IRedisService redisService)
        {
            _subscriptionRepo = subscriptionRepo;
            _redisService = redisService;
        }

        public async Task<IEnumerable<SubscriptionPlanDTO>> GetAllPlansAsync()
        {
            var cacheKey = "subscription-plans:all";
            var cached = await _redisService.GetAsync(cacheKey);
            if (!string.IsNullOrEmpty(cached))
            {
                Console.WriteLine($"[CACHE HIT] {cacheKey}");
                return JsonSerializer.Deserialize<List<SubscriptionPlanDTO>>(cached);
            }
            Console.WriteLine($"[CACHE MISS] {cacheKey}");

            var plans = await _subscriptionRepo.GetAllActivePlansAsync();
            
            var result = plans.Select(p => new SubscriptionPlanDTO
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                MonthlyPrice = p.MonthlyPrice,
                IsActive = (p.PlanFlags & (byte)PlanFlagsEnum.IsActive) != 0,
                MaxActiveListings = p.MaxActiveListings,
                HasCustomBanner = p.HasCustomBanner,
                HasFeaturedBadge = p.HasFeaturedBadge,
                PriorityLevel = p.PriorityLevel,
                AnalyticsLevel = p.AnalyticsLevel
            }).ToList();

            await _redisService.SetAsync(cacheKey, JsonSerializer.Serialize(result), TimeSpan.FromHours(12));
            return result;
        }

        public async Task<SubscriptionPlanDTO?> GetPlanByIdAsync(Guid id)
        {
            var cacheKey = $"subscription-plans:{id}";
            var cached = await _redisService.GetAsync(cacheKey);
            if (!string.IsNullOrEmpty(cached))
            {
                Console.WriteLine($"[CACHE HIT] {cacheKey}");
                return JsonSerializer.Deserialize<SubscriptionPlanDTO>(cached);
            }
            Console.WriteLine($"[CACHE MISS] {cacheKey}");

            var plan = await _subscriptionRepo.GetPlanByIdAsync(id);
            if (plan == null) return null;

            var dto = new SubscriptionPlanDTO
            {
                Id = plan.Id,
                Name = plan.Name,
                Description = plan.Description,
                MonthlyPrice = plan.MonthlyPrice,
                IsActive = (plan.PlanFlags & (byte)PlanFlagsEnum.IsActive) != 0,
                MaxActiveListings = plan.MaxActiveListings,
                HasCustomBanner = plan.HasCustomBanner,
                HasFeaturedBadge = plan.HasFeaturedBadge,
                PriorityLevel = plan.PriorityLevel,
                AnalyticsLevel = plan.AnalyticsLevel
            };

            await _redisService.SetAsync(cacheKey, JsonSerializer.Serialize(dto), TimeSpan.FromHours(12));
            return dto;
        }

        public async Task<SubscriptionPlanDTO> CreatePlanAsync(CreateSubscriptionPlanRequest request)
        {
            var newPlan = new SubscriptionPlan
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                MonthlyPrice = request.MonthlyPrice,
                PlanFlags = (byte)PlanFlagsEnum.IsActive,
                MaxActiveListings = request.MaxActiveListings,
                HasCustomBanner = request.HasCustomBanner,
                HasFeaturedBadge = request.HasFeaturedBadge,
                PriorityLevel = request.PriorityLevel,
                AnalyticsLevel = request.AnalyticsLevel
            };

            _subscriptionRepo.AddPlan(newPlan);
            await _subscriptionRepo.SaveChangesAsync();

            await _redisService.DeleteAsync("subscription-plans:all");
            Console.WriteLine($"[CACHE INVALIDATE] subscription-plans:all (Create)");

            return new SubscriptionPlanDTO
            {
                Id = newPlan.Id,
                Name = newPlan.Name,
                Description = newPlan.Description,
                MonthlyPrice = newPlan.MonthlyPrice,
                IsActive = true,
                MaxActiveListings = newPlan.MaxActiveListings,
                HasCustomBanner = newPlan.HasCustomBanner,
                HasFeaturedBadge = newPlan.HasFeaturedBadge,
                PriorityLevel = newPlan.PriorityLevel,
                AnalyticsLevel = newPlan.AnalyticsLevel
            };
        }

        public async Task<SubscriptionPlanDTO> UpdatePlanAsync(Guid id, UpdateSubscriptionPlanRequest request)
        {
            var plan = await _subscriptionRepo.GetPlanByIdAsync(id);

            if (plan == null)
            {
                throw new InvalidOperationException("Subscription Plan not found.");
            }

            plan.Name = request.Name;
            plan.Description = request.Description;
            plan.MonthlyPrice = request.MonthlyPrice;
            plan.MaxActiveListings = request.MaxActiveListings;
            plan.HasCustomBanner = request.HasCustomBanner;
            plan.HasFeaturedBadge = request.HasFeaturedBadge;
            plan.PriorityLevel = request.PriorityLevel;
            plan.AnalyticsLevel = request.AnalyticsLevel;

            await _subscriptionRepo.SaveChangesAsync();

            await _redisService.DeleteAsync("subscription-plans:all");
            await _redisService.DeleteAsync($"subscription-plans:{id}");
            Console.WriteLine($"[CACHE INVALIDATE] subscription-plans:all & subscription-plans:{id} (Update)");

            return new SubscriptionPlanDTO
            {
                Id = plan.Id,
                Name = plan.Name,
                Description = plan.Description,
                MonthlyPrice = plan.MonthlyPrice,
                IsActive = (plan.PlanFlags & (byte)PlanFlagsEnum.IsActive) != 0,
                MaxActiveListings = plan.MaxActiveListings,
                HasCustomBanner = plan.HasCustomBanner,
                HasFeaturedBadge = plan.HasFeaturedBadge,
                PriorityLevel = plan.PriorityLevel,
                AnalyticsLevel = plan.AnalyticsLevel
            };
        }

        public async Task DeletePlanAsync(Guid id)
        {
            var plan = await _subscriptionRepo.GetPlanByIdAsync(id);

            if (plan == null)
            {
                throw new InvalidOperationException("Subscription Plan not found.");
            }

            // Đánh dấu là đã xóa và gỡ cờ Active (nếu có)
            plan.PlanFlags = (byte)((plan.PlanFlags & ~(byte)PlanFlagsEnum.IsActive) | (byte)PlanFlagsEnum.IsDeleted);
            await _subscriptionRepo.SaveChangesAsync();

            await _redisService.DeleteAsync("subscription-plans:all");
            await _redisService.DeleteAsync($"subscription-plans:{id}");
            Console.WriteLine($"[CACHE INVALIDATE] subscription-plans:all & subscription-plans:{id} (Delete)");
        }
    }
}
