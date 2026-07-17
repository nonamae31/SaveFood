using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Services;

public class LocalReservationLockService : IReservationLockService
{
    private static readonly ConcurrentDictionary<Guid, SemaphoreSlim> _locks = new();
    private readonly SaveFoodDbContext _context;
    private readonly ICheckoutReservationRepository _reservationRepo;

    public LocalReservationLockService(SaveFoodDbContext context, ICheckoutReservationRepository reservationRepo)
    {
        _context = context;
        _reservationRepo = reservationRepo;
    }

    public async Task<bool> AcquireLockAsync(Guid listingId, int quantity, int priorityScore, CancellationToken cancellationToken)
    {
        var semaphore = _locks.GetOrAdd(listingId, _ => new SemaphoreSlim(1, 1));
        await semaphore.WaitAsync(cancellationToken);
        try
        {
            var listing = await _context.ClearanceListings.FirstOrDefaultAsync(l => l.Id == listingId, cancellationToken);
            if (listing == null) return false;

            var activeReservations = await _reservationRepo.GetActiveByListingIdAsync(listingId, cancellationToken);

            var reservedQuantity = activeReservations.Sum(r => r.Quantity);
            var availableQuantity = listing.QuantityAvailable - reservedQuantity;

            if (availableQuantity >= quantity)
            {
                return true;
            }

            var preemptable = activeReservations
                .Where(r => r.PriorityScore < priorityScore)
                .OrderBy(r => r.PriorityScore)
                .ThenBy(r => r.ExpiresAt)
                .ToList();

            var preemptedQuantity = 0;
            var toPreempt = new System.Collections.Generic.List<SaveFoodBackend.Models.CheckoutReservation>();

            foreach (var r in preemptable)
            {
                preemptedQuantity += r.Quantity;
                toPreempt.Add(r);
                if (availableQuantity + preemptedQuantity >= quantity)
                {
                    break;
                }
            }

            if (availableQuantity + preemptedQuantity >= quantity)
            {
                foreach (var p in toPreempt)
                {
                    await _reservationRepo.RemoveUserReservationAsync(listingId, p.UserId, cancellationToken);
                }
                return true;
            }

            return false;
        }
        finally
        {
            semaphore.Release();
        }
    }
}
