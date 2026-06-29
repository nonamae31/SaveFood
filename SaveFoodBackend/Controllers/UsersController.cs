using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Models;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.DTOs.Auth;
using MediatR;
using SaveFood.Application.Features.Auth;

namespace SaveFoodBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly SaveFoodDbContext _context;
        private readonly IUserService _userService;
        private readonly IMediator _mediator;

        public UsersController(SaveFoodDbContext context, IUserService userService, IMediator mediator)
        {
            _context = context;
            _userService = userService;
            _mediator = mediator;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.AsNoTracking().ToListAsync();
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(Guid id)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound();
            }

            return user;
        }

        // PUT: api/Users/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(Guid id, User user)
        {
            if (id != user.Id)
            {
                return BadRequest();
            }

            _context.Entry(user).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Users
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<User>> PostUser(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetUser", new { id = user.Id }, user);
        }

        // DELETE: api/Users/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UserExists(Guid id)
        {
            return _context.Users.Any(e => e.Id == id);
        }

        /// <summary>
        /// Đăng ký tài khoản người dùng mới (Customer)
        /// </summary>
        /// <param name="request">Thông tin đăng ký (Email, Password, FullName, PhoneNumber)</param>
        /// <returns>Mã ID của người dùng vừa tạo</returns>
        /// <response code="200">Đăng ký thành công</response>
        /// <response code="400">Dữ liệu đầu vào không hợp lệ hoặc Email đã tồn tại</response>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = await _mediator.Send(new RegisterCommand(request));
                return Ok(new { message = "Registration successful", userId });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

                var response = await _mediator.Send(new GoogleLoginCommand(request));

                // Set JWT Cookie
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true, // Must be true when SameSite = None
                    SameSite = SameSiteMode.None,
                    Expires = DateTime.UtcNow.AddDays(7)
                };
                Response.Cookies.Append("jwt", response.AccessToken, cookieOptions);

                var refreshCookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                    Expires = DateTime.UtcNow.AddDays(30)
                };
                Response.Cookies.Append("refreshToken", response.RefreshToken, refreshCookieOptions);

                return Ok(response);
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            await _mediator.Send(new ForgotPasswordCommand(request));
            return Ok(new { message = "Nếu email hợp lệ, một mã xác nhận đã được gửi đến email của bạn." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            await _mediator.Send(new ResetPasswordCommand(request));
            return Ok(new { message = "Khôi phục mật khẩu thành công." });
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _mediator.Send(new VerifyOtpCommand(request));
            return Ok(new { message = "Email verified successfully" });
        }

        [HttpPost("resend-otp")]
        public async Task<IActionResult> ResendOtp([FromBody] ResendOtpRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _mediator.Send(new ResendOtpCommand(request));
            return Ok(new { message = "A new OTP has been sent" });
        }

        /// <summary>
        /// Đăng nhập và nhận JWT Token
        /// </summary>
        /// <param name="request">Email và Password</param>
        /// <returns>Token đăng nhập kèm thông tin user cơ bản</returns>
        /// <response code="200">Đăng nhập thành công, trả về Token và Set-Cookie</response>
        /// <response code="400">Dữ liệu đầu vào không hợp lệ</response>
        /// <response code="401">Sai email hoặc mật khẩu, tài khoản bị khóa</response>
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _mediator.Send(new LoginCommand(request));

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddDays(7)
            };
            Response.Cookies.Append("jwt", response.AccessToken, cookieOptions);

            var refreshCookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddMonths(1)
            };
            Response.Cookies.Append("refreshToken", response.RefreshToken, refreshCookieOptions);

            return Ok(response);
        }

        /// <summary>
        /// Đăng xuất khỏi hệ thống
        /// </summary>
        /// <remarks>Sẽ vô hiệu hóa Session hiện tại trong Database và xóa JWT Cookie ở trình duyệt</remarks>
        /// <response code="200">Đăng xuất thành công</response>
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var accessToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            if (string.IsNullOrEmpty(accessToken))
            {
                accessToken = Request.Cookies["jwt"];
            }
            var refreshToken = Request.Cookies["refreshToken"];

            try
            {
                await _mediator.Send(new LogoutCommand(accessToken, refreshToken));
            }
            catch (Exception)
            {
                // Bỏ qua lỗi trong quá trình logout để vẫn xóa cookies
            }

            Response.Cookies.Delete("jwt");
            Response.Cookies.Delete("refreshToken");
            return Ok(new { message = "Logged out successfully" });
        }

        /// <summary>
        /// Xin cấp lại Access Token mới dựa vào Refresh Token (lưu trong Cookie)
        /// </summary>
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
            {
                return Unauthorized(new { message = "Refresh token is missing." });
            }

            var response = await _mediator.Send(new RefreshTokenCommand(refreshToken));

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddDays(7)
            };
            Response.Cookies.Append("jwt", response.AccessToken, cookieOptions);

            var refreshCookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddMonths(1) // 30 ngày
            };
            Response.Cookies.Append("refreshToken", response.RefreshToken, refreshCookieOptions);

            return Ok(response);
        }

        /// <summary>
        /// Lấy thông tin cá nhân (Profile) của User đang đăng nhập
        /// </summary>
        /// <returns>Đối tượng UserProfileDTO chứa thông tin user an toàn</returns>
        /// <response code="200">Lấy profile thành công</response>
        /// <response code="401">Chưa đăng nhập hoặc token đã hết hạn / bị thu hồi</response>
        /// <response code="404">Không tìm thấy thông tin user trong hệ thống</response>
        [Authorize]
        [HttpGet("profile")]
        public async Task<ActionResult<DTOs.User.UserProfileDTO>> GetProfile()
        {
            // Lấy ID từ token
            var userIdStr = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                         ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return Unauthorized(new { message = "User not logged in." });
            }

            var profile = await _userService.GetProfileAsync(userId);
            return Ok(profile);
        }

        /// <summary>
        /// Cập nhật thông tin cá nhân
        /// </summary>
        /// <param name="request">Các trường thông tin cá nhân cần sửa (FullName, PhoneNumber, Address, AvatarUrl)</param>
        /// <returns>Thông báo cập nhật thành công</returns>
        /// <response code="200">Cập nhật thành công</response>
        /// <response code="400">Dữ liệu gửi lên không hợp lệ</response>
        /// <response code="401">Chưa đăng nhập</response>
        /// <response code="404">Không tìm thấy user</response>
        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromForm] DTOs.User.UpdateProfileRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userIdStr = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                         ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return Unauthorized(new { message = "User not logged in." });
            }

            await _userService.UpdateProfileAsync(userId, request);
            return Ok(new { message = "Profile updated successfully." });
        }

        /// <summary>
        /// Đổi mật khẩu cho User đang đăng nhập
        /// </summary>
        [Authorize]
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] DTOs.User.ChangePasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userIdStr = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                         ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return Unauthorized(new { message = "User not logged in." });
            }

            await _userService.ChangePasswordAsync(userId, request);
            return Ok(new { message = "Đổi mật khẩu thành công." });
        }

        /// <summary>
        /// Cập nhật tọa độ vị trí hiện tại
        /// </summary>
        [Authorize]
        [HttpPut("location")]
        public async Task<IActionResult> UpdateLocation([FromBody] DTOs.User.UpdateLocationRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userIdStr = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                         ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
            {
                return Unauthorized(new { message = "User not logged in." });
            }

            await _userService.UpdateLocationAsync(userId, request);
            return Ok(new { message = "Location updated successfully." });
        }
    }
}
