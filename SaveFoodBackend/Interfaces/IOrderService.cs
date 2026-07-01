using System;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Customer.Orders;
using SaveFoodBackend.DTOs;

namespace SaveFoodBackend.Interfaces;

public interface IOrderService
{
    Task<CheckoutResponseDTO> CheckoutAsync(Guid userId, CheckoutRequestDTO req, CancellationToken ct = default);
    Task<CheckoutResponseDTO> BatchPayAsync(Guid userId, List<Guid> orderIds, byte paymentMethod, string? returnUrl, string? cancelUrl, CancellationToken ct = default);
    Task HandleSuccessfulPayment(long orderCode, PayOS.Models.Webhooks.WebhookData data);
    Task ProcessPaymentSuccessAsync(long orderCode, string reference, string accNum, string accName, string bankId);
    Task<bool> VerifyPickupAsync(Guid orderId, string pickupCode, Guid userId, CancellationToken ct = default);
    Task<PagedResult<OrderHistoryDTO>> GetMyOrdersAsync(Guid userId, int? status = null, int page = 1, int pageSize = 5, CancellationToken ct = default);
    Task<OrderDetailDTO> GetOrderByIdAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<bool> ExtendPickupTimeAsync(Guid orderId, Guid userId, int additionalMinutes, CancellationToken ct = default);
    Task<bool> CancelOrderAsync(Guid orderId, Guid userId, CancelOrderRequestDTO req, CancellationToken ct = default);
}
