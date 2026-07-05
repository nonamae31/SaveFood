using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFood.Application.CQRS;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Auth;
using SaveFoodBackend.Utils;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Models;

namespace SaveFood.Application.Features.Auth;

public class VerifyOtpCommand : ICommand<bool>
{
    public VerifyOtpRequest Request { get; set; }
    public VerifyOtpCommand(VerifyOtpRequest request) => Request = request;
}

public class VerifyOtpCommandHandler : ICommandHandler<VerifyOtpCommand, bool>
{
    private readonly SaveFoodDbContext _context;
    private readonly IRedisService _redisService;

    public VerifyOtpCommandHandler(SaveFoodDbContext context, IRedisService redisService)
    {
        _context = context;
        _redisService = redisService;
    }

    public async Task<bool> Handle(VerifyOtpCommand command, CancellationToken ct)
    {
        var request = command.Request;
        var normalizedEmail = AuthUtils.NormalizeEmail(request.Email);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == request.Email, ct);
        if (user == null) throw new InvalidOperationException("User not found.");
        if (user.EmailVerified) return true;

        var latestOtp = await _redisService.GetAsync($"otp:{normalizedEmail}");

        if (latestOtp == null) throw new InvalidOperationException("No OTP found or OTP has expired.");
        if (latestOtp != request.OtpCode) throw new InvalidOperationException("Invalid OTP code.");

        await _redisService.DeleteAsync($"otp:{normalizedEmail}");
        user.EmailVerified = true;

        _context.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Title = "Chào mừng bạn đến với SaveFood",
            Body = "Chúc mừng bạn đã tạo tài khoản thành công. Hãy khám phá các món ăn ngon giá rẻ ngay hôm nay!",
            Type = "SYSTEM",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(ct);
        return true;
    }
}
