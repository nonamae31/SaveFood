using PayOS;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SaveFoodBackend.Services
{
    public interface IPayOSService
    {
        Task<CreatePaymentLinkResponse> CreatePaymentLink(long orderCode, decimal amount, string description, string? orderId = null, string? returnUrlOverride = null, string? cancelUrlOverride = null);
        WebhookData VerifyPaymentWebhookData(Webhook webhookBody);
    }

    public class PayOSService : IPayOSService
    {
        private readonly PayOSClient _payOS;
        private readonly string _returnUrl;
        private readonly string _cancelUrl;

        public PayOSService(IConfiguration configuration)
        {
            var options = new PayOSOptions
            {
                ClientId = configuration["PayOS:ClientId"],
                ApiKey = configuration["PayOS:ApiKey"],
                ChecksumKey = configuration["PayOS:ChecksumKey"],
            };
            
            _returnUrl = configuration["PayOS:ReturnUrl"] ?? "http://localhost:5173/checkout/success";
            _cancelUrl = configuration["PayOS:CancelUrl"] ?? "http://localhost:5173/checkout/cancel";

            _payOS = new PayOSClient(options);
        }

        public async Task<CreatePaymentLinkResponse> CreatePaymentLink(long orderCode, decimal amount, string description, string? orderId = null, string? returnUrlOverride = null, string? cancelUrlOverride = null)
        {
            var item = new PaymentLinkItem
            {
                Name = description,
                Quantity = 1,
                Price = (int)amount
            };
            var items = new List<PaymentLinkItem> { item };

            string returnUrl = returnUrlOverride ?? _returnUrl;
            string cancelUrl = cancelUrlOverride ?? _cancelUrl;
            
            if (!string.IsNullOrEmpty(orderId))
            {
                returnUrl = returnUrl.Contains("?") ? $"{returnUrl}&orderId={orderId}" : $"{returnUrl}?orderId={orderId}";
                cancelUrl = cancelUrl.Contains("?") ? $"{cancelUrl}&orderId={orderId}" : $"{cancelUrl}?orderId={orderId}";
            }

            var paymentData = new CreatePaymentLinkRequest
            {
                OrderCode = orderCode,
                Amount = (int)amount,
                Description = description,
                Items = items,
                CancelUrl = cancelUrl,
                ReturnUrl = returnUrl
            };

            return await _payOS.PaymentRequests.CreateAsync(paymentData);
        }


        public WebhookData VerifyPaymentWebhookData(Webhook webhookBody)
        {
            return _payOS.Webhooks.VerifyAsync(webhookBody).GetAwaiter().GetResult();
        }
    }
}
