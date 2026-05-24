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
        var existingUser = await _context.Users.AnyAsync(u => u.Email == request.Email);
        if (existingUser)
        {
            throw new InvalidOperationException("Email already in use.");
        }

        var newUser = new Models.User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            UserStatusEnum = Models.Enums.UserStatus.Active,
            EmailVerified = false, // Chờ xác nhận OTP
            CreatedAt = DateTime.UtcNow
        };

        // Gán Role mặc định (Customer)
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Code == "Customer" || r.Name == "Customer");
        if (role != null)
        {
            newUser.UserRoles.Add(new Models.UserRole { RoleId = role.Id, UserId = newUser.Id });
        }

        _context.Users.Add(newUser);

        // Tạo mã OTP ngẫu nhiên 6 số
        var random = new Random();
        var otpCode = random.Next(100000, 999999).ToString();

        var verification = new Models.EmailVerification
        {
            Id = Guid.NewGuid(),
            UserId = newUser.Id,
            VerificationCode = otpCode,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15) // Hết hạn sau 15 phút
        };
        _context.EmailVerifications.Add(verification);

        await _context.SaveChangesAsync();

        // Gửi mã OTP qua Email thật
        var emailBody = $@"
            <h2>Xác thực tài khoản SaveFood</h2>
            <p>Chào {newUser.FullName},</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại SaveFood. Mã xác nhận OTP của bạn là:</p>
            <h1 style='color: #10b981; font-size: 32px; letter-spacing: 4px;'>{otpCode}</h1>
            <p>Mã này sẽ hết hạn sau 15 phút.</p>
            <p>Trân trọng,<br>Đội ngũ SaveFood</p>
        ";
        await _emailService.SendEmailAsync(newUser.Email, "Mã xác nhận OTP của bạn", emailBody);

        return newUser.Id;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        // 1. Find user by email
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

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
        catch (BCrypt.Net.SaltParseException)
        {
            // Fallback to plain text check if DB has plain text passwords (useful during migration)
            isPasswordValid = request.Password == user.PasswordHash;
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
            throw new UnauthorizedAccessException("Please verify your email first.");
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

        // Extract primary role, or default to empty
        var roleName = user.UserRoles.FirstOrDefault()?.Role?.Name ?? "Customer";

        return new LoginResponse
        {
            AccessToken = token,
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = roleName,
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
                claims.Add(new Claim(ClaimTypes.Role, userRole.Role.Name));
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
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
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
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
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

        GoogleJsonWebSignature.Payload payload;
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new[] { clientId }
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(request.Token, settings);
        }
        catch (InvalidJwtException)
        {
            throw new UnauthorizedAccessException("Invalid Google Token.");
        }

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == payload.Email);

        if (user == null)
        {
            // Tạo user mới
            user = new Models.User
            {
                Id = Guid.NewGuid(),
                Email = payload.Email,
                FullName = payload.Name ?? payload.Email,
                PasswordHash = Guid.NewGuid().ToString(), // Không ai biết mật khẩu này
                AvatarUrl = payload.Picture,
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
            if (string.IsNullOrEmpty(user.AvatarUrl) && !string.IsNullOrEmpty(payload.Picture))
            {
                user.AvatarUrl = payload.Picture;
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
        var roleName = user.UserRoles.FirstOrDefault()?.Role?.Name ?? "Customer";

        return new LoginResponse
        {
            AccessToken = token,
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = roleName,
            RefreshToken = session.RefreshTokenHash
        };
    }
}
