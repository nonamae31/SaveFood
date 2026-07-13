using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using SaveFoodBackend.DTOs.Complaints;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Application.Features.Complaints.Commands;

public class AddComplaintMessageCommand : IRequest<ComplaintMessageDto>
{
    public Guid ComplaintId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderRole { get; set; } = null!;
    public AddComplaintMessageDto Payload { get; set; } = null!;
}

public class AddComplaintMessageCommandHandler : IRequestHandler<AddComplaintMessageCommand, ComplaintMessageDto>
{
    private readonly IComplaintRepository _repo;
    private readonly SaveFoodBackend.Interfaces.IUnitOfWork _uow;
    private readonly INotificationQueue _notificationQueue;
    private readonly Microsoft.AspNetCore.SignalR.IHubContext<SaveFoodBackend.Hubs.ComplaintHub> _hubContext;

    private readonly SaveFoodBackend.Data.SaveFoodDbContext _context;

    public AddComplaintMessageCommandHandler(IComplaintRepository repo, SaveFoodBackend.Interfaces.IUnitOfWork uow, INotificationQueue notificationQueue, Microsoft.AspNetCore.SignalR.IHubContext<SaveFoodBackend.Hubs.ComplaintHub> hubContext, SaveFoodBackend.Data.SaveFoodDbContext context)
    {
        _repo = repo;
        _uow = uow;
        _notificationQueue = notificationQueue;
        _hubContext = hubContext;
        _context = context;
    }

    public async Task<ComplaintMessageDto> Handle(AddComplaintMessageCommand request, CancellationToken cancellationToken)
    {
        var complaint = await _repo.GetByIdWithDetailsAsync(request.ComplaintId);
        if (complaint == null) throw new InvalidOperationException("Complaint not found");
        if (complaint.Status == SaveFoodBackend.Models.Enums.ComplaintStatusEnum.Resolved) throw new InvalidOperationException("Cannot send messages to a resolved complaint");

        var message = new ComplaintMessage
        {
            ComplaintId = request.ComplaintId,
            SenderId = request.SenderId,
            SenderRole = request.SenderRole,
            Content = request.Payload.Content
        };

        _repo.AddMessage(message);
        complaint.UpdatedAt = DateTime.UtcNow;
        
        await _uow.SaveChangesAsync(cancellationToken);

        if (request.SenderRole == "Admin" || request.SenderRole == "ShopOwner")
        {
            await _notificationQueue.QueueNotificationAsync(new NotificationMessage
            {
                UserId = complaint.CustomerId,
                Title = "New Message on Complaint",
                Body = "You have a new message regarding your complaint.",
                Type = "Complaint_Message",
                ReferenceId = complaint.Id
            }, cancellationToken);
        }

        var sender = await _context.Users.FindAsync(new object[] { request.SenderId }, cancellationToken);
        string senderName = request.SenderRole == "Shop" || request.SenderRole == "Store" ? (complaint.Store?.Name ?? "Store") : (sender?.FullName ?? request.SenderRole);

        var resultDto = new ComplaintMessageDto
        {
            Id = message.Id,
            SenderId = message.SenderId,
            SenderRole = message.SenderRole,
            SenderName = senderName,
            Content = message.Content,
            CreatedAt = message.CreatedAt
        };

        await _hubContext.Clients.Group($"Complaint_{request.ComplaintId}").SendAsync("ReceiveMessage", resultDto, cancellationToken);

        return resultDto;
    }
}
