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
}
