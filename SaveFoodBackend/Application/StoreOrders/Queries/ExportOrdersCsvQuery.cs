using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Interfaces.Repositories;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Common.Exceptions;

namespace SaveFoodBackend.Application.StoreOrders.Queries;

public record ExportOrdersCsvQuery(Guid StoreId, Guid UserId, DateTime? FromDate, DateTime? ToDate) : IRequest<byte[]>;

public class ExportOrdersCsvQueryHandler : IRequestHandler<ExportOrdersCsvQuery, byte[]>
{
    private readonly SaveFoodDbContext _ctx;
    private readonly IStoreRepository _storeRepo;

    public ExportOrdersCsvQueryHandler(SaveFoodDbContext ctx, IStoreRepository storeRepo)
    {
        _ctx = ctx;
        _storeRepo = storeRepo;
    }

    public async Task<byte[]> Handle(ExportOrdersCsvQuery request, CancellationToken cancellationToken)
    {
        var store = await _storeRepo.GetStoreWithStaffsAsync(request.StoreId, cancellationToken);
        if (store == null) throw new NotFoundException("Cửa hàng không tồn tại.");
        if (!store.StoreStaffs.Any(s => s.UserId == request.UserId))
            throw new UnauthorizedException("Bạn không có quyền thực hiện thao tác này.");

        var query = _ctx.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.OrderItems)
            .Include(o => o.Payment)
            .Where(o => o.StoreId == request.StoreId);

        if (request.FromDate.HasValue)
        {
            var fDate = new DateTimeOffset(request.FromDate.Value.Year, request.FromDate.Value.Month, request.FromDate.Value.Day, 0, 0, 0, TimeSpan.FromHours(7)).UtcDateTime;
            query = query.Where(o => o.CreatedAt >= fDate);
        }
        if (request.ToDate.HasValue)
        {
            var tDate = new DateTimeOffset(request.ToDate.Value.Year, request.ToDate.Value.Month, request.ToDate.Value.Day, 23, 59, 59, 999, TimeSpan.FromHours(7)).UtcDateTime;
            query = query.Where(o => o.CreatedAt <= tDate);
        }

        var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync(cancellationToken);

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Ngày tạo,Mã đơn,Khách hàng,Trạng thái,Phương thức TT,Trạng thái TT,Tổng tiền,Nền tảng thu(5%),Thực nhận");

        foreach (var order in orders)
        {
            var date = TimeZoneInfo.ConvertTimeFromUtc(order.CreatedAt, TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time")).ToString("dd/MM/yyyy HH:mm");
            var statusStr = order.OrderStatus switch { OrderStatusEnum.Pending => "Chờ xác nhận", OrderStatusEnum.Confirmed => "Đã xác nhận", OrderStatusEnum.ReadyForPickup => "Chờ lấy", OrderStatusEnum.Completed => "Hoàn thành", OrderStatusEnum.Cancelled => "Đã hủy", OrderStatusEnum.AwaitingCustomerConfirmation => "Chờ khách xác nhận", _ => "Khác" };
            var payMethod = order.Payment?.PaymentMethod == (byte)SaveFoodBackend.Models.Enums.PaymentMethodEnum.Cash ? "Tiền mặt" : "Chuyển khoản";
            var payStatus = order.Payment?.Status == (byte)SaveFoodBackend.Models.Enums.PaymentStatusEnum.Paid ? "Đã thanh toán" : (order.Payment?.Status == (byte)SaveFoodBackend.Models.Enums.PaymentStatusEnum.Pending ? "Chờ thanh toán" : "Hủy/Thất bại");
            
            decimal platformFee = Math.Round(order.TotalAmount * 0.05m, 0, MidpointRounding.AwayFromZero);
            decimal storeNet = order.TotalAmount - platformFee;

            if (order.OrderStatus == OrderStatusEnum.Cancelled || (order.Payment?.Status != (byte)SaveFoodBackend.Models.Enums.PaymentStatusEnum.Paid && payMethod != "Tiền mặt"))
            {
                platformFee = 0;
                storeNet = 0;
            }

            sb.AppendLine($"{date},{order.OrderCode ?? 0},\"{order.User?.FullName}\",{statusStr},{payMethod},{payStatus},{order.TotalAmount},{platformFee},{storeNet}");
        }

        var preamble = System.Text.Encoding.UTF8.GetPreamble();
        return preamble.Concat(System.Text.Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
    }
}
