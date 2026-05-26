using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Auth;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Utils;

namespace SaveFoodBackend.Services;

public class AuthService : IAuthService
{
    private readonly SaveFoodDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;

    public AuthService(SaveFoodDbContext context, IConfiguration configuration, IEmailService emailService)
    {
        _context = context;
        _configuration = configuration;
        _emailService = emailService;
    }

    public async Task<Guid> RegisterAsync(RegisterRequest request)
    {
        var normalizedEmail = AuthUtils.NormalizeEmail(request.Email);

        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == request.Email);
        Models.User targetUser;

        if (existingUser != null)
        {
            if (existingUser.EmailVerified)
            {
                throw new InvalidOperationException("Email này đã được sử dụng.");
            }
            else
            {
                // Unverified -> Ghi đè thông tin
                targetUser = existingUser;
                targetUser.Email = request.Email;
                targetUser.NormalizedEmail = normalizedEmail;
                targetUser.Username = request.Username;
                targetUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
                targetUser.FullName = request.FullName;
                targetUser.PhoneNumber = request.PhoneNumber;
                targetUser.CreatedAt = DateTime.UtcNow; // Reset time
            }
        }
        else
        {
            targetUser = new Models.User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                NormalizedEmail = normalizedEmail,
                Username = request.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FullName = request.FullName,
                PhoneNumber = request.PhoneNumber,
                UserStatusEnum = Models.Enums.UserStatus.Active,
                EmailVerified = false,
                CreatedAt = DateTime.UtcNow
            };

            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Code == "Customer" || r.Name == "Customer");
            if (role != null)
            {
                targetUser.UserRoles.Add(new Models.UserRole { RoleId = role.Id, UserId = targetUser.Id });
            }
            _context.Users.Add(targetUser);
        }

        // Check Username
        var existingUserByUsername = await _context.Users.AnyAsync(u => u.Username == request.Username && u.Id != targetUser.Id);
        if (existingUserByUsername)
        {
            throw new InvalidOperationException("Username này đã được sử dụng.");
        }

        if (!string.IsNullOrEmpty(request.PhoneNumber))
        {
            var existingUserByPhone = await _context.Users.AnyAsync(u => u.PhoneNumber == request.PhoneNumber && (u.UserFlags & 8) == 8 && u.Id != targetUser.Id);
            if (existingUserByPhone)
            {
                throw new InvalidOperationException("Số điện thoại này đã được sử dụng.");
            }
        }

        // Tạo mã OTP ngẫu nhiên 6 số
        var random = new Random();
        var otpCode = random.Next(100000, 999999).ToString();

        var verification = new Models.EmailVerification
        {
            Id = Guid.NewGuid(),
            UserId = targetUser.Id,
            VerificationCode = otpCode,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15) // Hết hạn sau 15 phút
        };
        _context.EmailVerifications.Add(verification);

        await _context.SaveChangesAsync();

        // Gửi mã OTP qua Email thật
        var emailBody = $@"
            <h2>Xác thực tài khoản SaveFood</h2>
            <p>Chào {targetUser.FullName},</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại SaveFood. Mã xác nhận OTP của bạn là:</p>
            <h1 style='color: #10b981; font-size: 32px; letter-spacing: 4px;'>{otpCode}</h1>
            <p>Mã này sẽ hết hạn sau 15 phút.</p>
            <p>Trân trọng,<br>Đội ngũ SaveFood</p>
        ";
        await _emailService.SendEmailAsync(targetUser.Email, "Mã xác nhận OTP của bạn", emailBody);

        return targetUser.Id;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        // 1. Find user by email
        var normalizedEmail = AuthUtils.NormalizeEmail(request.Email);
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == request.Email);

        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        // 2. Verify password
        bool isPasswordValid = false;
        try
        {
            isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        }
        catch (Exception)
        {
            // Ignore parse errors (e.g., if it's not a bcrypt hash), validation just fails.
        }

        if (!isPasswordValid)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        if (user.UserStatusEnum != Models.Enums.UserStatus.Active)
        {
            throw new UnauthorizedAccessException("Account is locked or inactive.");
        }

        if (!user.EmailVerified)
        {
            throw new UnauthorizedAccessException("UNVERIFIED_ACCOUNT: Please verify your email first.");
        }

        // Tạo UserSession mới để quản lý trạng thái Đăng nhập
        var session = new Models.UserSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RefreshTokenHash = Guid.NewGuid().ToString(), // Gán tạm random string để qua validate NotNull của CSDL
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow
        };
        _context.UserSessions.Add(session);
        await _context.SaveChangesAsync();

        // 3. Generate Token
        var token = GenerateJwtToken(user, session.Id.ToString());

        // Extract primary role code (Prioritize ADMIN, then STORE, then default)
        var roleCode = user.UserRoles.Any(ur => ur.Role != null && ur.Role.Code == "ADMIN") ? "ADMIN" :
                       user.UserRoles.Any(ur => ur.Role != null && ur.Role.Code == "STORE") ? "STORE" :
                       user.UserRoles.FirstOrDefault(ur => ur.Role != null)?.Role?.Code ?? "Customer";

        return new LoginResponse
        {
            AccessToken = token,
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = roleCode,
            RefreshToken = session.RefreshTokenHash
        };
    }

    private string GenerateJwtToken(Models.User user, string sessionId)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var keyStr = jwtSettings["Key"];
        if (string.IsNullOrEmpty(keyStr)) throw new InvalidOperationException("JWT Key is not configured.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyStr));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("fullName", user.FullName),
            new Claim("sessionId", sessionId)
        }.ToList();

        // Add roles to claims
        foreach (var userRole in user.UserRoles)
        {
            if (userRole.Role != null)
            {
                claims.Add(new Claim(ClaimTypes.Role, userRole.Role.Code));
            }
        }

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7), // Token valid for 7 days
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<bool> VerifyOtpAsync(VerifyOtpRequest request)
    {
        var normalizedEmail = AuthUtils.NormalizeEmail(request.Email);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == request.Email);
        if (user == null)
            throw new InvalidOperationException("User not found.");

        if (user.EmailVerified)
            return true; // Already verified

        var latestOtp = await _context.EmailVerifications
            .Where(e => e.UserId == user.Id && e.VerifiedAt == null)
            .OrderByDescending(e => e.CreatedAt)
            .FirstOrDefaultAsync();

        if (latestOtp == null)
            throw new InvalidOperationException("No OTP found.");

        if (latestOtp.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("OTP has expired.");

        if (latestOtp.VerificationCode != request.OtpCode)
            throw new InvalidOperationException("Invalid OTP code.");

        // Mark as verified
        latestOtp.VerifiedAt = DateTime.UtcNow;
        user.EmailVerified = true;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ResendOtpAsync(ResendOtpRequest request)
    {
        var normalizedEmail = AuthUtils.NormalizeEmail(request.Email);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == request.Email);
        if (user == null)
            throw new InvalidOperationException("User not found.");

        if (user.EmailVerified)
            throw new InvalidOperationException("Email is already verified.");

        var latestOtp = await _context.EmailVerifications
            .Where(e => e.UserId == user.Id)
            .OrderByDescending(e => e.CreatedAt)
            .FirstOrDefaultAsync();

        // Kiểm tra chống spam: Không cho gửi nếu lần gửi gần nhất cách đây chưa đầy 60 giây
        if (latestOtp != null && latestOtp.CreatedAt > DateTime.UtcNow.AddSeconds(-60))
        {
            var waitTime = (int)(60 - (DateTime.UtcNow - latestOtp.CreatedAt).TotalSeconds);
            throw new InvalidOperationException($"Please wait {waitTime} seconds before requesting a new OTP.");
        }

        // Tạo mã OTP ngẫu nhiên 6 số mới
        var random = new Random();
        var otpCode = random.Next(100000, 999999).ToString();

        var verification = new Models.EmailVerification
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            VerificationCode = otpCode,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15) // Hết hạn sau 15 phút
        };
        _context.EmailVerifications.Add(verification);

        await _context.SaveChangesAsync();

        // Gửi mã OTP qua Email thật
        var emailBody = $@"
            <h2>Xác thực tài khoản SaveFood</h2>
            <p>Chào {user.FullName},</p>
            <p>Bạn vừa yêu cầu gửi lại mã xác nhận OTP. Mã xác nhận mới của bạn là:</p>
            <h1 style='color: #10b981; font-size: 32px; letter-spacing: 4px;'>{otpCode}</h1>
            <p>Mã này sẽ hết hạn sau 15 phút.</p>
            <p>Trân trọng,<br>Đội ngũ SaveFood</p>
        ";
        await _emailService.SendEmailAsync(user.Email, "Mã xác nhận OTP mới của bạn", emailBody);

        return true;
    }

    public async Task<LoginResponse> GoogleLoginAsync(GoogleLoginRequest request)
    {
        var googleSettings = _configuration.GetSection("Google");
        var clientId = googleSettings["ClientId"];
        
        if (string.IsNullOrEmpty(clientId))
            throw new InvalidOperationException("Google ClientId is not configured.");

        string payloadEmail = null;
        string payloadName = null;
        string payloadPicture = null;

        // Thêm ClockTolerance theo gợi ý của user để tránh lỗi lệch giờ (clock skew) 5 phút
        var settings = new GoogleJsonWebSignature.ValidationSettings()
        {
            Audience = new[] { clientId },
            ExpirationTimeClockTolerance = TimeSpan.FromMinutes(5),
            IssuedAtClockTolerance = TimeSpan.FromMinutes(5)
        };

        try
        {
            // Thử giải mã nếu là id_token (JWT)
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.Token, settings);
            payloadEmail = payload.Email;
            payloadName = payload.Name;
            payloadPicture = payload.Picture;
        }
        catch (InvalidJwtException ex)
        {
            // Nếu không phải là id_token hợp lệ (ví dụ: là access_token từ useGoogleLogin)
            // hoặc bị lỗi khác, ta fallback sang gọi Google UserInfo API
            using var httpClient = new System.Net.Http.HttpClient();
            httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", request.Token);
            var response = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                throw new UnauthorizedAccessException($"Invalid Google Token. JWT Error: {ex.Message}. UserInfo Error: {response.StatusCode} - {errorBody}");
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            var root = doc.RootElement;
            
            if (root.TryGetProperty("email", out var emailProp))
                payloadEmail = emailProp.GetString() ?? string.Empty;
                
            if (root.TryGetProperty("name", out var nameProp))
                payloadName = nameProp.GetString() ?? string.Empty;
                
            if (root.TryGetProperty("picture", out var picProp))
                payloadPicture = picProp.GetString() ?? string.Empty;
        }

        if (string.IsNullOrEmpty(payloadEmail))
        {
            throw new UnauthorizedAccessException("Could not retrieve email from Google Token.");
        }

        var normalizedEmail = AuthUtils.NormalizeEmail(payloadEmail);

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail);

        if (user == null)
        {
            // Tự tạo username từ email
            var username = payloadEmail.Split('@')[0];
            username = new string(username.Where(c => char.IsLetterOrDigit(c) || c == '_').ToArray());
            if (username.Length < 3) username = username.PadRight(3, 'a');
            if (username.Length > 20) username = username.Substring(0, 20);

            // Xử lý trùng username
            var isUsernameTaken = await _context.Users.AnyAsync(u => u.Username == username);
            if (isUsernameTaken)
            {
                username = username.Substring(0, Math.Min(15, username.Length)) + new Random().Next(1000, 9999).ToString();
            }

            // Tạo user mới
            user = new Models.User
            {
                Id = Guid.NewGuid(),
                Email = payloadEmail,
                NormalizedEmail = normalizedEmail,
                Username = username,
                FullName = payloadName ?? payloadEmail,
                PasswordHash = Guid.NewGuid().ToString(), // Không ai biết mật khẩu này
                AvatarUrl = payloadPicture,
                UserStatusEnum = Models.Enums.UserStatus.Active,
                EmailVerified = true, // Được Google xác thực
                CreatedAt = DateTime.UtcNow
            };

            // Gán Role mặc định (Customer)
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Code == "Customer" || r.Name == "Customer");
            if (role != null)
            {
                user.UserRoles.Add(new Models.UserRole { RoleId = role.Id, UserId = user.Id });
            }

            _context.Users.Add(user);
        }
        else
        {
            if (user.UserStatusEnum != Models.Enums.UserStatus.Active)
            {
                throw new UnauthorizedAccessException("Account is locked or inactive.");
            }
            
            // Cập nhật Avatar nếu cần
            if (string.IsNullOrEmpty(user.AvatarUrl) && !string.IsNullOrEmpty(payloadPicture))
            {
                user.AvatarUrl = payloadPicture;
            }
            
            // Đảm bảo đã verify
            if (!user.EmailVerified)
            {
                user.EmailVerified = true;
            }
        }

        var session = new Models.UserSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RefreshTokenHash = Guid.NewGuid().ToString(), // Random string
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow
        };
        _context.UserSessions.Add(session);
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user, session.Id.ToString());
        var roleCode = user.UserRoles.Any(ur => ur.Role != null && ur.Role.Code == "ADMIN") ? "ADMIN" :
                       user.UserRoles.Any(ur => ur.Role != null && ur.Role.Code == "STORE") ? "STORE" :
                       user.UserRoles.FirstOrDefault(ur => ur.Role != null)?.Role?.Code ?? "Customer";

        return new LoginResponse
        {
            AccessToken = token,
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = roleCode,
            RefreshToken = session.RefreshTokenHash
        };
    }

    public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var normalizedEmail = AuthUtils.NormalizeEmail(request.Email);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == request.Email);
        if (user == null)
        {
            // Trả về true luôn để tránh lộ thông tin email có tồn tại hay không (bảo mật)
            return true;
        }

        var latestOtp = await _context.EmailVerifications
            .Where(e => e.UserId == user.Id)
            .OrderByDescending(e => e.CreatedAt)
            .FirstOrDefaultAsync();

        // Kiểm tra chống spam: Không cho gửi nếu lần gửi gần nhất cách đây chưa đầy 60 giây
        if (latestOtp != null && latestOtp.CreatedAt > DateTime.UtcNow.AddSeconds(-60))
        {
            var waitTime = (int)(60 - (DateTime.UtcNow - latestOtp.CreatedAt).TotalSeconds);
            throw new InvalidOperationException($"Vui lòng đợi {waitTime} giây trước khi gửi yêu cầu mới.");
        }

        // Tạo mã OTP ngẫu nhiên 6 số mới
        var random = new Random();
        var otpCode = random.Next(100000, 999999).ToString();

        var verification = new Models.EmailVerification
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            VerificationCode = otpCode,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15) // Hết hạn sau 15 phút
        };
        _context.EmailVerifications.Add(verification);

        await _context.SaveChangesAsync();

        // Gửi mã OTP qua Email
        var emailBody = $@"
            <h2>Khôi phục mật khẩu SaveFood</h2>
            <p>Chào {user.FullName},</p>
            <p>Bạn vừa yêu cầu khôi phục mật khẩu. Mã xác nhận OTP của bạn là:</p>
            <h1 style='color: #10b981; font-size: 32px; letter-spacing: 4px;'>{otpCode}</h1>
            <p>Mã này sẽ hết hạn sau 15 phút. Nếu bạn không yêu cầu việc này, vui lòng bỏ qua email này.</p>
            <p>Trân trọng,<br>Đội ngũ SaveFood</p>
        ";
        await _emailService.SendEmailAsync(user.Email, "Mã xác nhận Khôi phục mật khẩu", emailBody);

        return true;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var normalizedEmail = AuthUtils.NormalizeEmail(request.Email);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == request.Email);
        if (user == null)
            throw new InvalidOperationException("User not found.");

        var latestOtp = await _context.EmailVerifications
            .Where(e => e.UserId == user.Id && e.VerifiedAt == null)
            .OrderByDescending(e => e.CreatedAt)
            .FirstOrDefaultAsync();

        if (latestOtp == null)
            throw new InvalidOperationException("Không tìm thấy yêu cầu khôi phục mật khẩu hợp lệ.");

        if (latestOtp.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("Mã OTP đã hết hạn.");

        if (latestOtp.VerificationCode != request.OtpCode)
            throw new InvalidOperationException("Mã OTP không chính xác.");

        // Mark as verified
        latestOtp.VerifiedAt = DateTime.UtcNow;
        
        // Đặt lại mật khẩu mới
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

        await _context.SaveChangesAsync();
        return true;
    }
}
