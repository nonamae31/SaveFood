using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;
using Microsoft.AspNetCore.SignalR;
using SaveFoodBackend.Hubs;

namespace SaveFoodBackend.Application.Features.Complaints.Commands;

public class RejectStopComplaintCommand : IRequest<bool>
{
    public Guid ComplaintId { get; set; }
    public Guid ActionBy { get; set; }
}

public class RejectStopComplaintCommandHandler : IRequestHandler<RejectStopComplaintCommand, bool>
{
    private readonly IComplaintRepository _repo;
    private readonly SaveFoodBackend.Interfaces.IUnitOfWork _uow;
    private readonly IHubContext<ComplaintHub> _hubContext;

    public RejectStopComplaintCommandHandler(IComplaintRepository repo, SaveFoodBackend.Interfaces.IUnitOfWork uow, IHubContext<ComplaintHub> hubContext)
    {
        _repo = repo;
        _uow = uow;
        _hubContext = hubContext;
    }

    public async Task<bool> Handle(RejectStopComplaintCommand request, CancellationToken cancellationToken)
    {
        var complaint = await _repo.GetByIdAsync(request.ComplaintId);
        if (complaint == null) return false;

        complaint.IsStopRequested = false;
        complaint.UpdatedAt = DateTime.UtcNow;

        _repo.AddHistory(new ComplaintHistory
        {
            ComplaintId = complaint.Id,
            OldStatus = complaint.Status,
            NewStatus = complaint.Status,
            ActionById = request.ActionBy,
            Note = "Khách hàng từ chối yêu cầu dừng khiếu nại"
        });

        await _uow.SaveChangesAsync(cancellationToken);

        await _hubContext.Clients.Group($"Complaint_{complaint.Id}")
            .SendAsync("ReceiveStatusUpdate", new { 
                status = complaint.Status.ToString(), 
                isStopRequested = complaint.IsStopRequested 
            }, cancellationToken);

        return true;
    }
}
