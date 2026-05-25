using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Admin;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Services
{
    public class SubscriptionPlanService : ISubscriptionPlanService
    {
        private readonly SaveFoodDbContext _context;

        public SubscriptionPlanService(SaveFoodDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SubscriptionPlanDTO>> GetAllPlansAsync()
        {
            var plans = await _context.SubscriptionPlans
                .Where(p => (p.PlanFlags & (byte)PlanFlagsEnum.IsDeleted) == 0)
                .Select(p => new SubscriptionPlanDTO
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    MonthlyPrice = p.MonthlyPrice,
                    IsActive = (p.PlanFlags & (byte)PlanFlagsEnum.IsActive) != 0
                })
                .ToListAsync();

            return plans;
        }

        public async Task<SubscriptionPlanDTO?> GetPlanByIdAsync(Guid id)
        {
            var plan = await _context.SubscriptionPlans
                .Where(p => p.Id == id && (p.PlanFlags & (byte)PlanFlagsEnum.IsDeleted) == 0)
                .Select(p => new SubscriptionPlanDTO
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    MonthlyPrice = p.MonthlyPrice,
                    IsActive = (p.PlanFlags & (byte)PlanFlagsEnum.IsActive) != 0
                })
                .FirstOrDefaultAsync();

            return plan;
        }

        public async Task<SubscriptionPlanDTO> CreatePlanAsync(CreateSubscriptionPlanRequest request)
        {
            var newPlan = new SubscriptionPlan
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                MonthlyPrice = request.MonthlyPrice,
                PlanFlags = (byte)PlanFlagsEnum.IsActive
            };

            _context.SubscriptionPlans.Add(newPlan);
            await _context.SaveChangesAsync();

            return new SubscriptionPlanDTO
            {
                Id = newPlan.Id,
                Name = newPlan.Name,
                Description = newPlan.Description,
                MonthlyPrice = newPlan.MonthlyPrice,
                IsActive = true
            };
        }

        public async Task<SubscriptionPlanDTO> UpdatePlanAsync(Guid id, UpdateSubscriptionPlanRequest request)
        {
            var plan = await _context.SubscriptionPlans.FindAsync(id);

            if (plan == null || (plan.PlanFlags & (byte)PlanFlagsEnum.IsDeleted) != 0)
            {
                throw new InvalidOperationException("Subscription Plan not found.");
            }

            plan.Name = request.Name;
            plan.Description = request.Description;
            plan.MonthlyPrice = request.MonthlyPrice;

            await _context.SaveChangesAsync();

            return new SubscriptionPlanDTO
            {
                Id = plan.Id,
                Name = plan.Name,
                Description = plan.Description,
                MonthlyPrice = plan.MonthlyPrice,
                IsActive = (plan.PlanFlags & (byte)PlanFlagsEnum.IsActive) != 0
            };
        }

        public async Task DeletePlanAsync(Guid id)
        {
            var plan = await _context.SubscriptionPlans.FindAsync(id);

            if (plan == null || (plan.PlanFlags & (byte)PlanFlagsEnum.IsDeleted) != 0)
            {
                throw new InvalidOperationException("Subscription Plan not found.");
            }

            plan.PlanFlags |= (byte)PlanFlagsEnum.IsDeleted;
            await _context.SaveChangesAsync();
        }
    }
}
