using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SaveFoodBackend.DTOs.Complaints;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Interfaces.Repositories;

namespace SaveFoodBackend.Application.Features.Complaints.Commands;

public class CreateComplaintCommand : IRequest<ComplaintDto>
{
    public Guid CustomerId { get; set; }
    public CreateComplaintDto Payload { get; set; } = null!;
}

public class CreateComplaintCommandHandler : IRequestHandler<CreateComplaintCommand, ComplaintDto>
{
    private readonly IComplaintRepository _repo;
    private readonly SaveFoodBackend.Interfaces.IUnitOfWork _uow;
    private readonly INotificationQueue _notificationQueue;
    private readonly IStoreRepository _storeRepo;
    private readonly IOrderRepository _orderRepo;

    public CreateComplaintCommandHandler(IComplaintRepository repo, SaveFoodBackend.Interfaces.IUnitOfWork uow, INotificationQueue notificationQueue, IStoreRepository storeRepo, IOrderRepository orderRepo)
    {
        _repo = repo;
        _uow = uow;
        _notificationQueue = notificationQueue;
        _storeRepo = storeRepo;
        _orderRepo = orderRepo;
    }

    public async Task<ComplaintDto> Handle(CreateComplaintCommand request, CancellationToken cancellationToken)
    {
        if (!request.Payload.OrderId.HasValue)
            throw new InvalidOperationException("OrderId là bắt buộc.");

        var order = await _orderRepo.GetOrderWithDetailsAsync(request.Payload.OrderId.Value, cancellationToken);
        
        if (order == null || order.UserId != request.CustomerId) 
            throw new InvalidOperationException("Đơn hàng không tồn tại hoặc không thuộc về bạn.");

        if (order.OrderStatus != SaveFoodBackend.Models.Enums.OrderStatusEnum.Completed && order.OrderStatus != SaveFoodBackend.Models.Enums.OrderStatusEnum.Cancelled) 
            throw new InvalidOperationException("Chỉ có thể khiếu nại đơn hàng đã Hoàn thành hoặc đã Hủy.");

        if ((DateTime.UtcNow - order.CreatedAt).TotalHours > 72) 
            throw new InvalidOperationException("Đã quá thời hạn 72 giờ để khiếu nại đơn hàng này.");

        var complaint = new Complaint
        {
            Id = Guid.NewGuid(),
            CustomerId = request.CustomerId,
            StoreId = order.StoreId,
            OrderId = request.Payload.OrderId,
            Title = request.Payload.Title,
            Description = request.Payload.Description,
            Type = request.Payload.Type,
            Status = SaveFoodBackend.Models.Enums.ComplaintStatusEnum.Pending
        };

        _repo.Add(complaint);

        foreach (var ev in request.Payload.Evidences)
        {
            _repo.AddEvidence(new ComplaintEvidence
            {
                ComplaintId = complaint.Id,
                FileUrl = ev.FileUrl,
                FileType = ev.FileType
            });
        }
        
        _repo.AddHistory(new ComplaintHistory
        {
            ComplaintId = complaint.Id,
            OldStatus = SaveFoodBackend.Models.Enums.ComplaintStatusEnum.Pending,
            NewStatus = SaveFoodBackend.Models.Enums.ComplaintStatusEnum.Pending,
            ActionById = request.CustomerId,
            Note = "Complaint Created"
        });

        await _uow.SaveChangesAsync(cancellationToken);

        // Notify Store Owner
        var store = await _storeRepo.GetStoreWithStaffsAsync(order.StoreId, cancellationToken);
        var owner = store?.StoreStaffs.FirstOrDefault();
        if (owner != null)
        {
            await _notificationQueue.QueueNotificationAsync(new NotificationMessage
            {
                UserId = owner.UserId,
                Title = "New Complaint",
                Body = "A new complaint has been filed for your store.",
                Type = "Complaint_Created",
                ReferenceId = complaint.Id
            }, cancellationToken);
        }

        return new ComplaintDto
        {
            Id = complaint.Id,
            CustomerId = complaint.CustomerId,
            StoreId = complaint.StoreId,
            OrderId = complaint.OrderId,
            Title = complaint.Title,
            Description = complaint.Description,
            Status = complaint.Status.ToString(),
            Type = complaint.Type.ToString(),
            CreatedAt = complaint.CreatedAt,
            UpdatedAt = complaint.UpdatedAt,
            Evidences = request.Payload.Evidences.Select(e => new ComplaintEvidenceDto
            {
                FileUrl = e.FileUrl,
                FileType = e.FileType
            }).ToList()
        };
    }
}
