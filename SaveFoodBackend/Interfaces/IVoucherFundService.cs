using System.Threading;
using System.Threading.Tasks;
using SaveFoodBackend.DTOs.Customer.Vouchers;

namespace SaveFoodBackend.Interfaces;

public interface IVoucherFundService
{
    /// <summary>
    /// Returns the current voucher fund progress for a customer.
    /// Returns an empty DTO (zero balances, empty transactions) if the customer
    /// has no fund yet (i.e., has never completed a qualifying order).
    /// </summary>
    Task<VoucherFundDTO> GetMyVoucherFundAsync(Guid userId, CancellationToken ct = default);
}
