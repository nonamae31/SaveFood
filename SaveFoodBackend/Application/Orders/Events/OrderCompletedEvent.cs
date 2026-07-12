using MediatR;

namespace SaveFoodBackend.Application.Orders.Events;

/// <summary>
/// Indicates the source that caused an order to transition to Completed status.
/// Used by handlers to apply source-specific business logic (e.g., voucher accrual
/// is only triggered for StaffScan, not AutoNoShow).
/// </summary>
public enum OrderCompletionSource
{
    /// <summary>Staff member scanned the customer's pickup QR code.</summary>
    StaffScan = 1,

    /// <summary>Background service auto-completed the order due to no-show past deadline.</summary>
    AutoNoShow = 2
}

/// <summary>
/// Published when an order transitions to the Completed state.
/// Handlers should check <see cref="Source"/> before applying source-specific logic.
/// </summary>
public record OrderCompletedEvent(
    Guid OrderId,
    Guid CustomerId,
    decimal OrderTotal,
    OrderCompletionSource Source
) : INotification;
