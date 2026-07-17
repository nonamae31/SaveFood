using System;
using System.Threading;
using System.Threading.Tasks;

namespace SaveFoodBackend.Interfaces;

public interface IReservationLockService
{
    Task<bool> AcquireLockAsync(Guid listingId, int quantity, int priorityScore, CancellationToken cancellationToken);
}
