using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SaveFood.Application.CQRS;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Auth;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Common.Constants;

namespace SaveFood.Application.Features.Auth;

public class RefreshTokenCommand : ICommand<LoginResponse>
{
    public string RefreshToken { get; set; }
    public RefreshTokenCommand(string refreshToken) => RefreshToken = refreshToken;
}

public class RefreshTokenCommandHandler : ICommandHandler<RefreshTokenCommand, LoginResponse>
{
    private readonly SaveFoodDbContext _context;
    private readonly IRedisService _redisService;
    private readonly IJwtProvider _jwtProvider;

    public RefreshTokenCommandHandler(SaveFoodDbContext context, IRedisService redisService, IJwtProvider jwtProvider)
    {
        _context = context; _redisService = redisService; _jwtProvider = jwtProvider;
    }

    public async Task<LoginResponse> Handle(RefreshTokenCommand command, CancellationToken ct)
    {
        var redisKey = $"session:{command.RefreshToken}";
        var sessionData = await _redisService.GetAsync(redisKey);
        if (string.IsNullOrEmpty(sessionData)) throw new UnauthorizedAccessException("Refresh token is invalid or expired.");

        var parts = sessionData.Split(':');
        if (parts.Length != 2) throw new UnauthorizedAccessException("Invalid session data format.");
        if (!Guid.TryParse(parts[0], out var userId)) throw new UnauthorizedAccessException("Invalid user ID in session.");

        var sessionId = parts[1];
        var user = await _context.Users
            .AsNoTracking()
            .AsSplitQuery()
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null || user.UserStatusEnum != SaveFoodBackend.Models.Enums.UserStatus.Active) throw new UnauthorizedAccessException("User not found or inactive.");

        await _redisService.DeleteAsync(redisKey);

        var newSessionId = Guid.NewGuid().ToString();
        var newRefreshToken = Guid.NewGuid().ToString();
        await _redisService.SetAsync($"session:{newRefreshToken}", $"{user.Id}:{newSessionId}", TimeSpan.FromDays(30));

        var token = _jwtProvider.GenerateJwtToken(user, newSessionId);
        var roleCode = user.UserRoles.Any(ur => ur.Role != null && ur.Role.Code == AppConstants.Roles.Admin) ? AppConstants.Roles.Admin :
                       user.UserRoles.Any(ur => ur.Role != null && ur.Role.Code == AppConstants.Roles.Store) ? AppConstants.Roles.Store :
                       user.UserRoles.FirstOrDefault(ur => ur.Role != null)?.Role?.Code ?? AppConstants.Roles.Customer;

        var storeStaff = await _context.StoreStaffs.FirstOrDefaultAsync(ss => ss.UserId == user.Id, ct);
        return new LoginResponse { AccessToken = token, UserId = user.Id, Email = user.Email, FullName = user.FullName, Role = roleCode, RefreshToken = newRefreshToken, StaffRole = storeStaff?.StaffRole };
    }
}
