using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly SaveFoodDbContext _ctx;
    private readonly DbSet<Order> _set;

    public OrderRepository(SaveFoodDbContext ctx)
    {
        _ctx = ctx;
        _set = ctx.Set<Order>();
    }

    public async Task<IEnumerable<Order>> GetOrdersByStoreAsync(Guid storeId, CancellationToken ct = default)
    {
        return await _set
            .Include(o => o.User)
            .Include(o => o.OrderItems)
            .Include(o => o.Payment)
            .Where(o => o.StoreId == storeId)
            .OrderByDescending(o => o.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<Order?> GetOrderWithDetailsAsync(Guid orderId, CancellationToken ct = default)
    {
        return await _set
            .Include(o => o.User)
            .Include(o => o.OrderItems)
            .Include(o => o.Store)
                .ThenInclude(s => s.StoreStaffs)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);
    }

    public async Task<Order?> GetOrderByPickupCodeAsync(Guid storeId, string pickupCode, CancellationToken ct = default)
    {
        return await _set
            .Include(o => o.User)
            .Include(o => o.OrderItems)
            .Include(o => o.Payment)
            .Where(o => o.StoreId == storeId && o.PickupCode == pickupCode)
            .FirstOrDefaultAsync(ct);
    }

    public void Update(Order order)
    {
        _set.Update(order);
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _ctx.SaveChangesAsync(ct);
    }

    public async Task<(int count, decimal revenue)> GetStoreAnalyticsByDateRangeAsync(Guid storeId, DateTime startDate, DateTime endDate, CancellationToken ct = default)
    {
        // Status = 3 is Completed
        var query = _set.Where(o => o.StoreId == storeId && o.OrderStatus == 3 && o.CreatedAt >= startDate && o.CreatedAt <= endDate);
        var count = await query.CountAsync(ct);
        var revenue = await query.SumAsync(o => o.TotalAmount, ct);
        return (count, revenue);
    }

    public async Task<List<decimal>> GetWeeklyRevenueAsync(Guid storeId, DateTime startDate, DateTime endDate, CancellationToken ct = default)
    {
        var orders = await _set
            .Where(o => o.StoreId == storeId && o.OrderStatus == 3 && o.CreatedAt >= startDate && o.CreatedAt <= endDate)
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Revenue = g.Sum(o => o.TotalAmount) })
            .ToListAsync(ct);

        var result = new List<decimal>();
        for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
        {
            var dailyRevenue = orders.FirstOrDefault(o => o.Date == date)?.Revenue ?? 0;
            result.Add(dailyRevenue);
        }
        return result;
    }

    public async Task<List<SaveFoodBackend.DTOs.Store.TopSellingProductDTO>> GetTopSellingProductsAsync(Guid storeId, int count, CancellationToken ct = default)
    {
        return await _ctx.OrderItems
            .Include(oi => oi.Order)
            .Include(oi => oi.Listing)
                .ThenInclude(l => l.Product)
            .Where(oi => oi.Order != null && oi.Order.StoreId == storeId && oi.Order.OrderStatus == 3)
            .GroupBy(oi => oi.Listing.Product.Name)
            .Select(g => new SaveFoodBackend.DTOs.Store.TopSellingProductDTO
            {
                Name = g.Key,
                Sales = g.Sum(oi => oi.Quantity)
            })
            .OrderByDescending(x => x.Sales)
            .Take(count)
            .ToListAsync(ct);
    }
}
