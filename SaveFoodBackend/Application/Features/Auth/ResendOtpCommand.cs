using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFood.Application.CQRS;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Auth;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Utils;

namespace SaveFood.Application.Features.Auth;

public class ResendOtpCommand : ICommand<bool>
{
    public ResendOtpRequest Request { get; set; }
    public ResendOtpCommand(ResendOtpRequest request) => Request = request;
}

public class ResendOtpCommandHandler : ICommandHandler<ResendOtpCommand, bool>
{
    private readonly SaveFoodDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IRedisService _redisService;

    public ResendOtpCommandHandler(SaveFoodDbContext context, IEmailService emailService, IRedisService redisService)
    {
        _context = context; _emailService = emailService; _redisService = redisService;
    }

    public async Task<bool> Handle(ResendOtpCommand command, CancellationToken ct)
    {
        var request = command.Request;
        var normalizedEmail = AuthUtils.NormalizeEmail(request.Email);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == request.Email, ct);
        if (user == null) throw new InvalidOperationException("User not found.");
        if (user.EmailVerified) throw new InvalidOperationException("Email is already verified.");

        var isCooldown = await _redisService.GetAsync($"otp_cooldown:{normalizedEmail}");
        if (isCooldown != null)
            throw new InvalidOperationException($"Please wait a moment before requesting a new OTP.");

        var otpCode = new Random().Next(100000, 999999).ToString();
        await _redisService.SetAsync($"otp:{normalizedEmail}", otpCode, TimeSpan.FromMinutes(15));
        await _redisService.SetAsync($"otp_cooldown:{normalizedEmail}", "true", TimeSpan.FromSeconds(60));

        await _emailService.SendEmailAsync(user.Email, "Mã xác nhận OTP mới của bạn", $@"<h2>Xác thực tài khoản SaveFood</h2><p>Mã xác nhận mới của bạn là:</p><h1 style='color: #10b981; font-size: 32px;'>{otpCode}</h1>");
        return true;
    }
}
