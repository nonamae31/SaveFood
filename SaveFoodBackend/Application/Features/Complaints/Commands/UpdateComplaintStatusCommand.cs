using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SaveFoodBackend.DTOs.Complaints;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;
using Microsoft.AspNetCore.SignalR;
using SaveFoodBackend.Hubs;

namespace SaveFoodBackend.Application.Features.Complaints.Commands;

public class UpdateComplaintStatusCommand : IRequest<bool>
{
    public Guid ComplaintId { get; set; }
    public Guid ActionBy { get; set; }
    public UpdateComplaintStatusDto Payload { get; set; } = null!;
}

public class UpdateComplaintStatusCommandHandler : IRequestHandler<UpdateComplaintStatusCommand, bool>
{
    private readonly IComplaintRepository _repo;
    private readonly SaveFoodBackend.Interfaces.IUnitOfWork _uow;
    private readonly INotificationQueue _notificationQueue;
    private readonly IHubContext<ComplaintHub> _hubContext;

    public UpdateComplaintStatusCommandHandler(IComplaintRepository repo, SaveFoodBackend.Interfaces.IUnitOfWork uow, INotificationQueue notificationQueue, IHubContext<ComplaintHub> hubContext)
    {
        _repo = repo;
        _uow = uow;
        _notificationQueue = notificationQueue;
        _hubContext = hubContext;
    }

    public async Task<bool> Handle(UpdateComplaintStatusCommand request, CancellationToken cancellationToken)
    {
        var complaint = await _repo.GetByIdAsync(request.ComplaintId);
        if (complaint == null) return false;

        var oldStatus = complaint.Status;
        if (oldStatus == request.Payload.Status) return true;

        complaint.Status = request.Payload.Status;
        complaint.UpdatedAt = DateTime.UtcNow;

        _repo.AddHistory(new ComplaintHistory
        {
            ComplaintId = complaint.Id,
            OldStatus = oldStatus,
            NewStatus = request.Payload.Status,
            ActionById = request.ActionBy,
            Note = request.Payload.Note
        });

        await _uow.SaveChangesAsync(cancellationToken);

        await _hubContext.Clients.Group($"Complaint_{complaint.Id}")
            .SendAsync("ReceiveStatusUpdate", new { 
                status = complaint.Status.ToString(), 
                isStopRequested = complaint.IsStopRequested 
            }, cancellationToken);

        // Notify Customer
        await _notificationQueue.QueueNotificationAsync(new NotificationMessage
        {
            UserId = complaint.CustomerId,
            Title = "Complaint Status Updated",
            Body = $"Your complaint status changed to {complaint.Status}.",
            Type = "Complaint_Updated",
            ReferenceId = complaint.Id
        }, cancellationToken);

        return true;
    }
}
