using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Repositories;

public class ComplaintRepository : IComplaintRepository
{
    private readonly SaveFoodDbContext _context;

    public ComplaintRepository(SaveFoodDbContext context)
    {
        _context = context;
    }

    public void Add(Complaint complaint) => _context.Complaints.Add(complaint);
    public void AddEvidence(ComplaintEvidence evidence) => _context.ComplaintEvidences.Add(evidence);
    public void AddHistory(ComplaintHistory history) => _context.ComplaintHistories.Add(history);
    public void AddMessage(ComplaintMessage message) => _context.ComplaintMessages.Add(message);

    public async Task<Complaint?> GetByIdAsync(Guid id)
    {
        return await _context.Complaints.FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Complaint?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _context.Complaints
            .Include(c => c.Customer)
            .Include(c => c.Store)
            .Include(c => c.ComplaintEvidences)
            .Include(c => c.ComplaintHistories).ThenInclude(h => h.ActionBy)
            .Include(c => c.ComplaintMessages).ThenInclude(m => m.Sender)
            .Include(c => c.Order)
                .ThenInclude(o => o.OrderItems)
                    .ThenInclude(oi => oi.Listing)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<(List<Complaint> Items, int TotalCount)> GetListAsync(Guid? customerId, Guid? storeId, SaveFoodBackend.Models.Enums.ComplaintStatusEnum? status, int pageIndex, int pageSize)
    {
        var query = _context.Complaints
            .Include(c => c.Customer)
            .Include(c => c.Store)
            .Include(c => c.ComplaintEvidences)
            .AsQueryable();

        if (customerId.HasValue) query = query.Where(c => c.CustomerId == customerId.Value);
        if (storeId.HasValue) query = query.Where(c => c.StoreId == storeId.Value);
        if (status.HasValue) query = query.Where(c => c.Status == status.Value);

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(c => c.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }
}
