using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Common.Exceptions;

namespace SaveFoodBackend.Application.Orders.Commands;

public record ExtendPickupTimeCommand(Guid OrderId, Guid UserId, int AdditionalMinutes) : IRequest<bool>;

public class ExtendPickupTimeCommandHandler : IRequestHandler<ExtendPickupTimeCommand, bool>
{
    private readonly SaveFoodDbContext _ctx;

    public ExtendPickupTimeCommandHandler(SaveFoodDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<bool> Handle(ExtendPickupTimeCommand request, CancellationToken cancellationToken)
    {
        var order = await _ctx.Orders.FirstOrDefaultAsync(o => o.Id == request.OrderId && o.UserId == request.UserId, cancellationToken);
        
        if (order == null)
            throw new NotFoundException("Không tìm thấy đơn hàng.");

        if (order.OrderStatus != SaveFoodBackend.Models.Enums.OrderStatusEnum.Confirmed)
            throw new BusinessException("Chỉ có thể gia hạn giờ lấy cho đơn hàng đã thanh toán và đang chờ lấy.");

        if (!order.ExpectedPickupTime.HasValue || !order.MaxPickupTime.HasValue)
            throw new BusinessException("Đơn hàng này không hỗ trợ hẹn giờ lấy.");

        var newPickupTime = order.ExpectedPickupTime.Value.AddMinutes(request.AdditionalMinutes);

        if (newPickupTime > order.MaxPickupTime.Value)
            throw new BusinessException("Thời gian gia hạn vượt quá giới hạn cho phép (Quá giờ đóng cửa hoặc quá hạn sử dụng của món ăn).");

        order.ExpectedPickupTime = newPickupTime;
        await _ctx.SaveChangesAsync(cancellationToken);
        
        return true;
    }
}
