using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Interfaces.Repositories;

public interface IComplaintRepository
{
    void Add(Complaint complaint);
    void AddEvidence(ComplaintEvidence evidence);
    void AddHistory(ComplaintHistory history);
    void AddMessage(ComplaintMessage message);
    
    Task<Complaint?> GetByIdAsync(Guid id);
    Task<Complaint?> GetByIdWithDetailsAsync(Guid id);
    Task<(List<Complaint> Items, int TotalCount)> GetListAsync(Guid? customerId, Guid? storeId, SaveFoodBackend.Models.Enums.ComplaintStatusEnum? status, int pageIndex, int pageSize);
}
