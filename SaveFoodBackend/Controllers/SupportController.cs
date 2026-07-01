using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Models.DTOs;
using SaveFoodBackend.Common;
using System.Security.Claims;

namespace SaveFoodBackend.Controllers
{
    [ApiController]
    [Route("api/support")]
    public class SupportController : ApiControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IConfiguration _config;

        public SupportController(IEmailService emailService, ICloudinaryService cloudinaryService, IConfiguration config)
        {
            _emailService = emailService;
            _cloudinaryService = cloudinaryService;
            _config = config;
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> SubmitTicket([FromForm] SupportTicketRequest request)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var userEmail = User.FindFirstValue(ClaimTypes.Email);
                var userName = User.FindFirstValue(ClaimTypes.Name);

                string? imageUrl = null;

                if (request.Image != null && request.Image.Length > 0)
                {
                    var uploadResult = await _cloudinaryService.UploadImageAsync(request.Image);
                    imageUrl = uploadResult.SecureUrl;
                }

                // Get support email from config or fallback
                var supportEmail = _config["SupportEmail"] ?? "savefood.work247@gmail.com";

                var subject = $"[Yêu cầu hỗ trợ] {request.Title} - Từ {userName}";
                
                var body = $@"
                    <h2>Yêu cầu hỗ trợ mới từ ứng dụng SaveFood</h2>
                    <p><strong>Người gửi:</strong> {userName} ({userEmail})</p>
                    <p><strong>ID Người dùng:</strong> {userId}</p>
                    <p><strong>Tiêu đề:</strong> {request.Title}</p>
                    <hr />
                    <p><strong>Nội dung:</strong></p>
                    <p>{request.Message.Replace("\n", "<br/>")}</p>
                ";

                if (!string.IsNullOrEmpty(imageUrl))
                {
                    body += $@"
                        <hr />
                        <p><strong>Ảnh đính kèm:</strong></p>
                        <img src=""{imageUrl}"" alt=""Attachment"" style=""max-width: 100%; border-radius: 8px;"" />
                    ";
                }

                await _emailService.SendEmailAsync(supportEmail, subject, body, true);

                return Ok(new ApiResponse<string>
                {
                    Success = true,
                    Message = "Yêu cầu hỗ trợ đã được gửi thành công",
                    Data = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Fail("Lỗi khi gửi yêu cầu hỗ trợ: " + ex.Message));
            }
        }
    }
}
