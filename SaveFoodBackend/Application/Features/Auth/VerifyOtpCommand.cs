using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFood.Application.CQRS;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Auth;
using SaveFoodBackend.Utils;

namespace SaveFood.Application.Features.Auth;

public class VerifyOtpCommand : ICommand<bool>
{
    public VerifyOtpRequest Request { get; set; }
    public VerifyOtpCommand(VerifyOtpRequest request) => Request = request;
}

public class VerifyOtpCommandHandler : ICommandHandler<VerifyOtpCommand, bool>
{
    private readonly SaveFoodDbContext _context;

    public VerifyOtpCommandHandler(SaveFoodDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(VerifyOtpCommand command, CancellationToken ct)
    {
        var request = command.Request;
        var normalizedEmail = AuthUtils.NormalizeEmail(request.Email);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == request.Email, ct);
        if (user == null) throw new InvalidOperationException("User not found.");
        if (user.EmailVerified) return true;

        var latestOtp = await _context.EmailVerifications
            .Where(e => e.UserId == user.Id && e.VerifiedAt == null)
            .OrderByDescending(e => e.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (latestOtp == null) throw new InvalidOperationException("No OTP found.");
        if (latestOtp.ExpiresAt < DateTime.UtcNow) throw new InvalidOperationException("OTP has expired.");
        if (latestOtp.VerificationCode != request.OtpCode) throw new InvalidOperationException("Invalid OTP code.");

        latestOtp.VerifiedAt = DateTime.UtcNow;
        user.EmailVerified = true;
        await _context.SaveChangesAsync(ct);
        return true;
    }
}
