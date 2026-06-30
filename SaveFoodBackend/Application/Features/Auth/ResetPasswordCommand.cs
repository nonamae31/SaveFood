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

namespace SaveFood.Application.Features.Auth;

public class ResetPasswordCommand : ICommand<bool>
{
    public ResetPasswordRequest Request { get; set; }
    public ResetPasswordCommand(ResetPasswordRequest request) => Request = request;
}

public class ResetPasswordCommandHandler : ICommandHandler<ResetPasswordCommand, bool>
{
    private readonly SaveFoodDbContext _context;
    private readonly IRedisService _redisService;

    public ResetPasswordCommandHandler(SaveFoodDbContext context, IRedisService redisService)
    {
        _context = context;
        _redisService = redisService;
    }

    public async Task<bool> Handle(ResetPasswordCommand command, CancellationToken ct)
    {
        var request = command.Request;
        var normalizedEmail = AuthUtils.NormalizeEmail(request.Email);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == request.Email, ct);
        if (user == null) throw new InvalidOperationException("User not found.");

        var latestOtp = await _redisService.GetAsync($"otp:{normalizedEmail}");
        if (latestOtp == null) throw new InvalidOperationException("Không tìm thấy yêu cầu khôi phục mật khẩu hợp lệ hoặc mã OTP đã hết hạn.");
        if (latestOtp != request.OtpCode) throw new InvalidOperationException("Mã OTP không chính xác.");

        await _redisService.DeleteAsync($"otp:{normalizedEmail}");
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync(ct);
        return true;
    }
}
