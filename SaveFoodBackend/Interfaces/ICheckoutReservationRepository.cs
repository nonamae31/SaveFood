using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Interfaces;

public interface ICheckoutReservationRepository
{
    Task AddRangeAsync(IEnumerable<CheckoutReservation> reservations, CancellationToken cancellationToken);
    Task<IEnumerable<CheckoutReservation>> GetActiveByListingIdAsync(Guid listingId, CancellationToken cancellationToken);
    Task RemoveUserReservationAsync(Guid listingId, Guid userId, CancellationToken cancellationToken);
}
