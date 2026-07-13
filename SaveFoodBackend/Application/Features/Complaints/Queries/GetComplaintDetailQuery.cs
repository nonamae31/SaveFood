using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SaveFoodBackend.DTOs.Complaints;
using SaveFoodBackend.Interfaces.Repositories;

namespace SaveFoodBackend.Application.Features.Complaints.Queries;

public class GetComplaintDetailQuery : IRequest<ComplaintDetailDto?>
{
    public Guid Id { get; set; }
}

public class GetComplaintDetailQueryHandler : IRequestHandler<GetComplaintDetailQuery, ComplaintDetailDto?>
{
    private readonly IComplaintRepository _repo;

    public GetComplaintDetailQueryHandler(IComplaintRepository repo)
    {
        _repo = repo;
    }

    public async Task<ComplaintDetailDto?> Handle(GetComplaintDetailQuery request, CancellationToken cancellationToken)
    {
        var c = await _repo.GetByIdWithDetailsAsync(request.Id);
        if (c == null) return null;

        return new ComplaintDetailDto
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
            }).ToList(),
            Histories = c.ComplaintHistories.OrderBy(h => h.CreatedAt).Select(h => new ComplaintHistoryDto
            {
                Id = h.Id,
                OldStatus = h.OldStatus.ToString(),
                NewStatus = h.NewStatus.ToString(),
                ActionBy = h.ActionById,
                Note = h.Note,
                CreatedAt = h.CreatedAt
            }).ToList(),
            Messages = c.ComplaintMessages.OrderBy(m => m.CreatedAt).Select(m => new ComplaintMessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                SenderRole = m.SenderRole,
                SenderName = m.SenderRole == "Shop" || m.SenderRole == "Store" ? c.Store.Name : (m.Sender?.FullName ?? m.SenderRole),
                Content = m.Content,
                CreatedAt = m.CreatedAt
            }).ToList()
        };
    }
}
