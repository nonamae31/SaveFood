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

public class RequestStopComplaintCommand : IRequest<bool>
{
    public Guid ComplaintId { get; set; }
    public Guid ActionBy { get; set; }
    public string Role { get; set; } = null!;
}

public class RequestStopComplaintCommandHandler : IRequestHandler<RequestStopComplaintCommand, bool>
{
    private readonly IComplaintRepository _repo;
    private readonly SaveFoodBackend.Interfaces.IUnitOfWork _uow;
    private readonly IHubContext<ComplaintHub> _hubContext;

    public RequestStopComplaintCommandHandler(IComplaintRepository repo, SaveFoodBackend.Interfaces.IUnitOfWork uow, IHubContext<ComplaintHub> hubContext)
    {
        _repo = repo;
        _uow = uow;
        _hubContext = hubContext;
    }

    public async Task<bool> Handle(RequestStopComplaintCommand request, CancellationToken cancellationToken)
    {
        var complaint = await _repo.GetByIdAsync(request.ComplaintId);
        if (complaint == null) return false;

        if (complaint.Status == ComplaintStatusEnum.Resolved ||
            complaint.Status == ComplaintStatusEnum.Rejected ||
            complaint.Status == ComplaintStatusEnum.Cancelled)
        {
            return false;
        }

        complaint.IsStopRequested = true;
        complaint.StopRequestedByRole = request.Role;
        complaint.UpdatedAt = DateTime.UtcNow;

        _repo.AddHistory(new ComplaintHistory
        {
            ComplaintId = complaint.Id,
            OldStatus = complaint.Status,
            NewStatus = complaint.Status,
            ActionById = request.ActionBy,
            Note = "Yêu cầu dừng khiếu nại từ " + request.Role
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
