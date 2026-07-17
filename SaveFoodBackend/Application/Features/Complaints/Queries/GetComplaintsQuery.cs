using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SaveFoodBackend.DTOs.Complaints;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models.Enums;

namespace SaveFoodBackend.Application.Features.Complaints.Queries;

public class GetComplaintsQuery : IRequest<object>
{
    public Guid? CustomerId { get; set; }
    public Guid? StoreId { get; set; }
    public SaveFoodBackend.Models.Enums.ComplaintStatusEnum? Status { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GetComplaintsQueryHandler : IRequestHandler<GetComplaintsQuery, object>
{
    private readonly IComplaintRepository _repo;

    public GetComplaintsQueryHandler(IComplaintRepository repo)
    {
        _repo = repo;
    }

    public async Task<object> Handle(GetComplaintsQuery request, CancellationToken cancellationToken)
    {
        var (items, total) = await _repo.GetListAsync(request.CustomerId, request.StoreId, request.Status, request.PageIndex, request.PageSize);

        return new
        {
            TotalCount = total,
            Items = items.Select(c => new ComplaintDto
            {
                Id = c.Id,
                CustomerId = c.CustomerId,
                CustomerName = c.Customer.FullName,
                CustomerEmail = c.Customer.Email,
                StoreId = c.StoreId,
                StoreName = c.Store.Name,
                OrderId = c.OrderId,
                ProductId = c.Order != null ? c.Order.OrderItems.FirstOrDefault()?.Listing?.ProductId : null,
                ListingId = c.Order != null ? c.Order.OrderItems.FirstOrDefault()?.ListingId : null,
                Title = c.Title,
                Description = c.Description,
                Status = c.Status.ToString(),
                Type = c.Type.ToString(),
                IsStopRequested = c.IsStopRequested,
                StopRequestedByRole = c.StopRequestedByRole,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                Evidences = c.ComplaintEvidences.Select(e => new ComplaintEvidenceDto
                {
                    Id = e.Id,
                    FileUrl = e.FileUrl,
                    FileType = e.FileType
                }).ToList()
            })
        };
    }
}
