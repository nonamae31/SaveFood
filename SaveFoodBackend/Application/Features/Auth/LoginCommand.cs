using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SaveFood.Application.CQRS;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Auth;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Utils;
using SaveFoodBackend.Common.Constants;

namespace SaveFood.Application.Features.Auth;

public class LoginCommand : ICommand<LoginResponse>
{
    public LoginRequest Request { get; set; }
    public LoginCommand(LoginRequest request) => Request = request;
}

public class LoginCommandHandler : ICommandHandler<LoginCommand, LoginResponse>
{
    private readonly SaveFoodDbContext _context;
    private readonly IRedisService _redisService;
    private readonly IJwtProvider _jwtProvider;

    public LoginCommandHandler(SaveFoodDbContext context, IRedisService redisService, IJwtProvider jwtProvider)
    {
        _context = context; _redisService = redisService; _jwtProvider = jwtProvider;
    }

    public async Task<LoginResponse> Handle(LoginCommand command, CancellationToken ct)
    {
        var request = command.Request;
        var normalizedEmail = AuthUtils.NormalizeEmail(request.Email);
        var user = await _context.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == request.Email, ct);

        if (user == null) throw new UnauthorizedAccessException("Invalid email or password.");
        bool isPasswordValid = false;
        try { isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash); } catch { }

        if (!isPasswordValid) throw new UnauthorizedAccessException("Invalid email or password.");
        if (user.UserStatusEnum != SaveFoodBackend.Models.Enums.UserStatus.Active) throw new UnauthorizedAccessException("Account is locked or inactive.");
        if (!user.EmailVerified) throw new UnauthorizedAccessException("UNVERIFIED_ACCOUNT: Please verify your email first.");

        var sessionId = Guid.NewGuid().ToString(); var refreshToken = Guid.NewGuid().ToString();
        await _redisService.SetAsync($"session:{refreshToken}", $"{user.Id}:{sessionId}", TimeSpan.FromDays(30));

        var token = _jwtProvider.GenerateJwtToken(user, sessionId);
        var roleCode = user.UserRoles.FirstOrDefault(ur => ur.Role != null && ur.Role.Code == AppConstants.Roles.Admin)?.Role?.Code ??
                       user.UserRoles.FirstOrDefault(ur => ur.Role != null && ur.Role.Code == AppConstants.Roles.Store)?.Role?.Code ??
                       user.UserRoles.FirstOrDefault(ur => ur.Role != null)?.Role?.Code ?? AppConstants.Roles.Customer;

        var storeStaff = await _context.StoreStaffs.FirstOrDefaultAsync(ss => ss.UserId == user.Id, ct);

        return new LoginResponse { AccessToken = token, UserId = user.Id, Email = user.Email, FullName = user.FullName, Role = roleCode, RefreshToken = refreshToken, StaffRole = storeStaff?.StaffRole };
    }

}
