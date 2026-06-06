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

namespace SaveFoodBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly SaveFoodDbContext _context;
        private readonly IAuthService _authService;
        private readonly IUserService _userService;

        public UsersController(SaveFoodDbContext context, IAuthService authService, IUserService userService)
        {
            _context = context;
            _authService = authService;
            _userService = userService;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);

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
                var userId = await _authService.RegisterAsync(request);
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

            try
            {
                var response = await _authService.GoogleLoginAsync(request);

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
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                await _authService.ForgotPasswordAsync(request);
                return Ok(new { message = "Nếu email hợp lệ, một mã xác nhận đã được gửi đến email của bạn." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                await _authService.ResetPasswordAsync(request);
                return Ok(new { message = "Khôi phục mật khẩu thành công." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                await _authService.VerifyOtpAsync(request);
                return Ok(new { message = "Email verified successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("resend-otp")]
        public async Task<IActionResult> ResendOtp([FromBody] ResendOtpRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                await _authService.ResendOtpAsync(request);
                return Ok(new { message = "A new OTP has been sent" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
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

            try
            {
                var response = await _authService.LoginAsync(request);

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
            catch (UnauthorizedAccessException ex)
            {
                if (ex.Message.StartsWith("UNVERIFIED_ACCOUNT:"))
                {
                    return StatusCode(403, new { 
                        code = "UNVERIFIED_ACCOUNT", 
                        message = ex.Message.Substring("UNVERIFIED_ACCOUNT:".Length).Trim(),
                        email = request.Email
                    });
                }
                return Unauthorized(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Đăng xuất khỏi hệ thống
        /// </summary>
        /// <remarks>Sẽ vô hiệu hóa Session hiện tại trong Database và xóa JWT Cookie ở trình duyệt</remarks>
        /// <response code="200">Đăng xuất thành công</response>
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var sessionIdStr = User.FindFirst("sessionId")?.Value;
            if (!string.IsNullOrEmpty(sessionIdStr) && Guid.TryParse(sessionIdStr, out Guid sessionId))
            {
                var session = await _context.UserSessions.FindAsync(sessionId);
                if (session != null)
                {
                    session.RevokedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }

            Response.Cookies.Delete("jwt");
            return Ok(new { message = "Logged out successfully" });
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

            try
            {
                var profile = await _userService.GetProfileAsync(userId);
                return Ok(profile);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
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

            try
            {
                await _userService.UpdateProfileAsync(userId, request);
                return Ok(new { message = "Profile updated successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
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

            try
            {
                await _userService.ChangePasswordAsync(userId, request);
                return Ok(new { message = "Đổi mật khẩu thành công." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
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

            try
            {
                await _userService.UpdateLocationAsync(userId, request);
                return Ok(new { message = "Location updated successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
