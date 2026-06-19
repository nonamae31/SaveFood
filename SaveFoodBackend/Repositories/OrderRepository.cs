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
            .Include(o => o.Payment)
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
        var revenue = await query.SumAsync(o => o.TotalAmount * 0.95m, ct); // Deduct 5% platform fee
        return (count, revenue);
    }

    public async Task<List<decimal>> GetWeeklyRevenueAsync(Guid storeId, DateTime startDate, DateTime endDate, CancellationToken ct = default)
    {
        var orders = await _set
            .Where(o => o.StoreId == storeId && o.OrderStatus == 3 && o.CreatedAt >= startDate && o.CreatedAt <= endDate)
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Revenue = g.Sum(o => o.TotalAmount * 0.95m) }) // Deduct 5% platform fee
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

    public async Task<bool> HasActiveOrdersAsync(Guid userId, CancellationToken ct = default)
    {
        // 0: Pending, 1: Confirmed, 2: AwaitingPickup
        return await _set.AnyAsync(o => o.UserId == userId && (o.OrderStatus == 0 || o.OrderStatus == 1 || o.OrderStatus == 2), ct);
    }

    public async Task<double> GetReturnCustomerRateAsync(Guid storeId, CancellationToken ct = default)
    {
        var userOrders = await _set
            .Where(o => o.StoreId == storeId && o.OrderStatus == 3) // Only completed orders
            .GroupBy(o => o.UserId)
            .Select(g => new { UserId = g.Key, OrderCount = g.Count() })
            .ToListAsync(ct);

        if (!userOrders.Any()) return 0;

        var totalCustomers = userOrders.Count;
        var returningCustomers = userOrders.Count(u => u.OrderCount > 1);

        return Math.Round((double)returningCustomers / totalCustomers * 100, 1);
    }

    public async Task<decimal> GetPendingRevenueAsync(Guid storeId, CancellationToken ct = default)
    {
        // Active orders: 0 (Pending), 1 (Confirmed), 2 (ReadyForPickup)
        var query = _set.Include(o => o.Payment)
                        .Where(o => o.StoreId == storeId 
                                 && (o.OrderStatus == 0 || o.OrderStatus == 1 || o.OrderStatus == 2)
                                 && o.Payment != null && o.Payment.Status == 1);
        var revenue = await query.SumAsync(o => o.TotalAmount * 0.95m, ct); // Deduct 5% platform fee
        return revenue;
    }
}
