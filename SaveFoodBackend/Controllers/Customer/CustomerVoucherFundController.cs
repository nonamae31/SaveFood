using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaveFoodBackend.Controllers;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Controllers.Customer;

[ApiController]
[Route("api/customer/voucher-fund")]
[Authorize]
public class CustomerVoucherFundController : ApiControllerBase
{
    private readonly IVoucherFundService _voucherFundService;

    public CustomerVoucherFundController(IVoucherFundService voucherFundService)
    {
        _voucherFundService = voucherFundService;
    }

    /// <summary>
    /// Returns the current voucher fund balance and recent accrual history for the authenticated customer.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMyVoucherFund(CancellationToken ct)
    {
        try
        {
            var userId = GetRequiredUserId();
            var result = await _voucherFundService.GetMyVoucherFundAsync(userId, ct);
            return OkResponse(result);
        }
        catch (Exception ex)
        {
            return BadRequestResponse(ex.ToString());
        }
    }
}
