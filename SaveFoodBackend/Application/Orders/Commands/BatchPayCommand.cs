using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Customer.Orders;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Models;
using SaveFoodBackend.Models.Enums;
using SaveFoodBackend.Hubs;
using Microsoft.AspNetCore.SignalR;
using SaveFoodBackend.Common.Exceptions;
using SaveFoodBackend.Services;

namespace SaveFoodBackend.Application.Orders.Commands;

public record BatchPayCommand(Guid UserId, List<Guid> OrderIds, byte PaymentMethod, string? ReturnUrl, string? CancelUrl) : IRequest<CheckoutResponseDTO>;

public class BatchPayCommandHandler : IRequestHandler<BatchPayCommand, CheckoutResponseDTO>
{
    private readonly SaveFoodDbContext _ctx;
    private readonly IPayOSService _payOSService;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly IUnitOfWork _unitOfWork;

    public BatchPayCommandHandler(SaveFoodDbContext ctx, IPayOSService payOSService, IHubContext<NotificationHub> hubContext, IUnitOfWork unitOfWork)
    {
        _ctx = ctx;
        _payOSService = payOSService;
        _hubContext = hubContext;
        _unitOfWork = unitOfWork;
    }

    public async Task<CheckoutResponseDTO> Handle(BatchPayCommand request, CancellationToken cancellationToken)
    {
        var orders = await _ctx.Orders
            .Include(o => o.Payment)
            .Where(o => request.OrderIds.Contains(o.Id) && o.UserId == request.UserId)
            .ToListAsync(cancellationToken);

        if (orders.Count != request.OrderIds.Count) 
            throw new BusinessException("Không tìm thấy một số đơn hàng, hoặc bạn không có quyền thanh toán.");
            
        if (orders.Any(o => o.OrderStatus != OrderStatusEnum.Pending || o.Payment == null || (o.Payment.Status != 0 && o.Payment.Status != 2)))
            throw new BusinessException("Chỉ có thể thanh toán lại các đơn hàng đang chờ thanh toán.");

        decimal grandTotal = orders.Sum(o => o.TotalAmount);
        byte finalPaymentMethod = request.PaymentMethod;

        if (finalPaymentMethod == 0) // Wallet
        {
            var customerWallet = await _ctx.CustomerWallets.FirstOrDefaultAsync(w => w.UserId == request.UserId, cancellationToken);
            if (customerWallet != null && customerWallet.Balance >= grandTotal) 
            {
                await _unitOfWork.BeginTransactionAsync(cancellationToken);

                customerWallet.Balance -= grandTotal;
                foreach (var order in orders)
                {
                    order.Payment.PaymentMethod = 0;
                    order.Payment.Status = 1;
                    order.Payment.PaidAt = DateTime.UtcNow;
                    order.ReservationExpiresAt = null;

                    _ctx.CustomerWalletTransactions.Add(new CustomerWalletTransaction
                    {
                        Id = Guid.NewGuid(),
                        CustomerWalletId = customerWallet.Id,
                        Amount = order.TotalAmount,
                        Type = 2,
                        Status = 1,
                        OrderId = order.Id,
                        Description = "Thanh toán đơn hàng DH " + order.OrderCode,
                        CreatedAt = DateTime.UtcNow
                    });

                    var storeWallet = await _ctx.StoreWallets.FirstOrDefaultAsync(w => w.StoreId == order.StoreId, cancellationToken);
                    if (storeWallet == null) 
                    {
                        storeWallet = new StoreWallet { Id = Guid.NewGuid(), StoreId = order.StoreId, AvailableBalance = 0, PendingBalance = 0, UpdatedAt = DateTime.UtcNow };
                        _ctx.StoreWallets.Add(storeWallet);
                    }
                    decimal platformFee = Math.Round(order.TotalAmount * 0.05m, 0, MidpointRounding.AwayFromZero);
                    storeWallet.PendingBalance += (order.TotalAmount - platformFee);
                }
                
                await _unitOfWork.CommitTransactionAsync(cancellationToken);

                foreach (var order in orders)
                {
                    await _hubContext.Clients.Group($"User_{order.UserId}").SendAsync("NewNotification", "Thanh toán thành công!", $"Đơn hàng #{order.OrderCode} đã thanh toán bằng ví.", cancellationToken: cancellationToken);
                    
                    var staffIds = await _ctx.StoreStaffs.Where(s => s.StoreId == order.StoreId).Select(s => s.UserId).ToListAsync(cancellationToken);
                    foreach (var uid in staffIds.Distinct())
                    {
                        await _hubContext.Clients.Group($"User_{uid}").SendAsync("NewOrderReceived", order.Id, cancellationToken: cancellationToken);
                    }
                }

                return new CheckoutResponseDTO { OrderId = orders.First().Id, CheckoutUrl = null };
            }
            finalPaymentMethod = 1; // Fallback to PayOS
        }

        if (finalPaymentMethod == 1) // PayOS
        {
            long newOrderCode = long.Parse(DateTimeOffset.UtcNow.ToString("yyMMddHHmmss") + new Random().Next(100, 999).ToString());
            foreach (var order in orders)
            {
                order.OrderCode = newOrderCode;
                order.Payment.PaymentMethod = 1;
                order.Payment.Status = 0;
                order.ReservationExpiresAt = DateTime.UtcNow.AddMinutes(10);
            }
            await _ctx.SaveChangesAsync(cancellationToken);

            var payOSResult = await _payOSService.CreatePaymentLink(newOrderCode, grandTotal, $"DH {newOrderCode}", newOrderCode.ToString(), request.ReturnUrl, request.CancelUrl);
            return new CheckoutResponseDTO
            {
                OrderId = orders.First().Id,
                CheckoutUrl = payOSResult.CheckoutUrl,
                ReservationExpiresAt = orders.First().ReservationExpiresAt
            };
        }

        throw new BusinessException("Phương thức thanh toán không hợp lệ.");
    }
}
