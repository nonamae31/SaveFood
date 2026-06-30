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

public class ForgotPasswordCommand : ICommand<bool>
{
    public ForgotPasswordRequest Request { get; set; }
    public ForgotPasswordCommand(ForgotPasswordRequest request) => Request = request;
}

public class ForgotPasswordCommandHandler : ICommandHandler<ForgotPasswordCommand, bool>
{
    private readonly SaveFoodDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IRedisService _redisService;

    public ForgotPasswordCommandHandler(SaveFoodDbContext context, IEmailService emailService, IRedisService redisService)
    {
        _context = context; _emailService = emailService; _redisService = redisService;
    }

    public async Task<bool> Handle(ForgotPasswordCommand command, CancellationToken ct)
    {
        var request = command.Request;
        var normalizedEmail = AuthUtils.NormalizeEmail(request.Email);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == request.Email, ct);
        if (user == null) return true;

        var isCooldown = await _redisService.GetAsync($"otp_cooldown:{normalizedEmail}");
        if (isCooldown != null)
            throw new InvalidOperationException($"Vui lòng đợi một lát trước khi gửi yêu cầu mới.");

        var otpCode = new Random().Next(100000, 999999).ToString();
        await _redisService.SetAsync($"otp:{normalizedEmail}", otpCode, TimeSpan.FromMinutes(15));
        await _redisService.SetAsync($"otp_cooldown:{normalizedEmail}", "true", TimeSpan.FromSeconds(60));

        await _emailService.SendEmailAsync(user.Email, "Mã xác nhận Khôi phục mật khẩu", $@"<h2>Khôi phục mật khẩu SaveFood</h2><p>Mã xác nhận OTP của bạn là:</p><h1 style='color: #10b981; font-size: 32px;'>{otpCode}</h1>");
        return true;
    }
}
