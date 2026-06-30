using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFood.Application.CQRS;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Auth;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Utils;

namespace SaveFood.Application.Features.Auth;

public class RegisterCommand : ICommand<Guid>
{
    public RegisterRequest Request { get; set; }
    public RegisterCommand(RegisterRequest request) => Request = request;
}

public class RegisterCommandHandler : ICommandHandler<RegisterCommand, Guid>
{
    private readonly SaveFoodDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IRedisService _redisService;

    public RegisterCommandHandler(SaveFoodDbContext context, IEmailService emailService, IRedisService redisService)
    {
        _context = context;
        _emailService = emailService;
        _redisService = redisService;
    }

    public async Task<Guid> Handle(RegisterCommand command, CancellationToken ct)
    {
        var request = command.Request;
        var normalizedEmail = AuthUtils.NormalizeEmail(request.Email);
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == request.Email, ct);
        SaveFoodBackend.Models.User targetUser;

        if (existingUser != null)
        {
            if (existingUser.EmailVerified) throw new InvalidOperationException("Email này đã được sử dụng.");
            targetUser = existingUser;
            targetUser.Email = request.Email;
            targetUser.NormalizedEmail = normalizedEmail;
            targetUser.Username = request.Username;
            targetUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            targetUser.FullName = request.FullName;
            targetUser.PhoneNumber = request.PhoneNumber;
            if (request.Gender.HasValue) targetUser.IsMale = (request.Gender.Value == 1);
            targetUser.CreatedAt = DateTime.UtcNow;
        }
        else
        {
            targetUser = new SaveFoodBackend.Models.User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                NormalizedEmail = normalizedEmail,
                Username = request.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FullName = request.FullName,
                PhoneNumber = request.PhoneNumber,
                UserStatusEnum = SaveFoodBackend.Models.Enums.UserStatus.Active,
                EmailVerified = false,
                CreatedAt = DateTime.UtcNow
            };
            if (request.Gender.HasValue) targetUser.IsMale = (request.Gender.Value == 1);

            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Code == "Customer" || r.Name == "Customer", ct);
            if (role != null) targetUser.UserRoles.Add(new SaveFoodBackend.Models.UserRole { RoleId = role.Id, UserId = targetUser.Id });
            _context.Users.Add(targetUser);
        }

        var existingUserByUsername = await _context.Users.AnyAsync(u => u.Username == request.Username && u.Id != targetUser.Id, ct);
        if (existingUserByUsername) throw new InvalidOperationException("Username này đã được sử dụng.");

        if (!string.IsNullOrEmpty(request.PhoneNumber))
        {
            var existingUserByPhone = await _context.Users.AnyAsync(u => u.PhoneNumber == request.PhoneNumber && (u.UserFlags & 8) == 8 && u.Id != targetUser.Id, ct);
            if (existingUserByPhone) throw new InvalidOperationException("Số điện thoại này đã được sử dụng.");
        }

        var otpCode = new Random().Next(100000, 999999).ToString();
        await _redisService.SetAsync($"otp:{normalizedEmail}", otpCode, TimeSpan.FromMinutes(15));
        await _redisService.SetAsync($"otp_cooldown:{normalizedEmail}", "true", TimeSpan.FromSeconds(60));

        await _context.SaveChangesAsync(ct);
        await _emailService.SendEmailAsync(targetUser.Email, "Mã xác nhận OTP của bạn", $@"<h2>Xác thực tài khoản SaveFood</h2><p>Chào {targetUser.FullName},</p><p>Mã xác nhận OTP của bạn là:</p><h1 style='color: #10b981; font-size: 32px;'>{otpCode}</h1><p>Mã này hết hạn sau 15 phút.</p>");

        return targetUser.Id;
    }
}
