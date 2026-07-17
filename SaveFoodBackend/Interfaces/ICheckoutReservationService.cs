using System;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs;

namespace SaveFoodBackend.Interfaces;

public interface ICheckoutReservationService
{
    Task<ReserveOrderResponse> ReserveAsync(Guid userId, ReserveOrderRequest request, string idempotencyKey, CancellationToken cancellationToken);
}
