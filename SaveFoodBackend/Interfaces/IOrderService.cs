using System;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Customer.Orders;

namespace SaveFoodBackend.Interfaces;

public interface IOrderService
{
    Task<CheckoutResponseDTO> CheckoutAsync(Guid userId, CheckoutRequestDTO req, CancellationToken ct = default);
    Task<bool> VerifyPickupAsync(Guid orderId, string pickupCode, Guid userId, CancellationToken ct = default);
    Task<System.Collections.Generic.List<OrderHistoryDTO>> GetMyOrdersAsync(Guid userId, CancellationToken ct = default);
    Task<OrderDetailDTO> GetOrderByIdAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<bool> ExtendPickupTimeAsync(Guid orderId, Guid userId, int additionalMinutes, CancellationToken ct = default);
    Task<bool> CancelOrderAsync(Guid orderId, Guid userId, CancelOrderRequestDTO req, CancellationToken ct = default);
}

