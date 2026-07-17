using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Hubs;
using SaveFoodBackend.Application.Orders.Events;
using Microsoft.AspNetCore.SignalR;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Common.Exceptions;

namespace SaveFoodBackend.Application.Orders.Commands;

public record VerifyPickupCommand(Guid OrderId, string PickupCode, Guid UserId) : IRequest<bool>;

    public class VerifyPickupCommandHandler : IRequestHandler<VerifyPickupCommand, bool>
    {
        private readonly SaveFoodDbContext _ctx;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IPublisher _publisher;
        private readonly SaveFoodBackend.Interfaces.IJwtProvider _jwtProvider;

        public VerifyPickupCommandHandler(SaveFoodDbContext ctx, IHubContext<NotificationHub> hubContext, IPublisher publisher, SaveFoodBackend.Interfaces.IJwtProvider jwtProvider)
        {
            _ctx = ctx;
            _hubContext = hubContext;
            _publisher = publisher;
            _jwtProvider = jwtProvider;
        }

        public async Task<bool> Handle(VerifyPickupCommand request, CancellationToken cancellationToken)
        {
            Guid targetOrderId = request.OrderId;

            // Try to decode as QR Token first
            var decodedOrderId = _jwtProvider.ValidateQrToken(request.PickupCode);
            if (decodedOrderId.HasValue)
            {
                targetOrderId = decodedOrderId.Value;
            }

            var order = await _ctx.Orders
                .Include(o => o.Store)
                    .ThenInclude(s => s.StoreStaffs)
                .Include(o => o.Payment)
                .FirstOrDefaultAsync(o => o.Id == targetOrderId, cancellationToken);

            if (order == null)
                throw new NotFoundException("Đơn hàng không tồn tại.");

            bool isStaff = order.Store.StoreStaffs.Any(s => s.UserId == request.UserId);
            if (!isStaff)
                throw new UnauthorizedException("Bạn không có quyền xác nhận đơn hàng của cửa hàng này.");

            if (order.OrderStatus == OrderStatusEnum.Cancelled)
                throw new BusinessException("Đơn hàng đã bị huỷ.");
            if (order.OrderStatus == OrderStatusEnum.Completed)
                throw new BusinessException("Đơn hàng đã được xác nhận lấy hàng trước đó.");
            if (order.OrderStatus == OrderStatusEnum.AwaitingCustomerConfirmation)
                throw new BusinessException("Đơn hàng đã được xác nhận, đang chờ khách hàng xác nhận trên ứng dụng.");

            if (order.OrderStatus != OrderStatusEnum.ReadyForPickup)
                throw new BusinessException("Đơn hàng chưa ở trạng thái sẵn sàng giao.");

            if (!decodedOrderId.HasValue && order.PickupCode != request.PickupCode)
                throw new BusinessException("Mã nhận hàng không chính xác.");

            if (order.Payment != null && order.Payment.PaymentMethod == 1 && order.Payment.Status == 0) // PayOS but pending
            {
                throw new BusinessException("Đơn hàng thanh toán online chưa hoàn tất thanh toán. Vui lòng kiểm tra lại.");
            }

            order.OrderStatus = OrderStatusEnum.AwaitingCustomerConfirmation;
            order.ConfirmedById = request.UserId;

            await _ctx.SaveChangesAsync(cancellationToken);

            await _hubContext.Clients.Group($"User_{order.UserId}").SendAsync("OrderStatusChanged", order.Id, (int)order.OrderStatus, cancellationToken: cancellationToken);
            await _hubContext.Clients.Group($"User_{order.UserId}").SendAsync("OrderStatusUpdated", order.Id, (int)order.OrderStatus, cancellationToken: cancellationToken);

            return true;
        }
    }

