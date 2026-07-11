using Microsoft.EntityFrameworkCore;
using SaveFood.Application.CQRS;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Auth;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Utils;
using SaveFoodBackend.Common.Constants;
using SaveFoodBackend.Common.Exceptions;
using SaveFoodBackend.Models.Enums;

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
        var user = await _context.Users
            .AsNoTracking()
            .AsSplitQuery()
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == request.Email, ct);

        if (user == null) throw new BusinessException("Invalid email or password.", "INVALID_CREDENTIALS", 401);
        bool isPasswordValid = false;
        try { isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash); } catch { }

        if (!isPasswordValid) throw new BusinessException("Invalid email or password.", "INVALID_CREDENTIALS", 401);
        if (user.UserStatusEnum != UserStatus.Active) throw new BusinessException("Account is locked or inactive.", "ACCOUNT_LOCKED_OR_INACTIVE", 403);
        if (user.EmailVerified == false)
        {
            throw new BusinessException(
                "Tài khoản chưa được xác thực. Vui lòng kiểm tra email để lấy mã OTP.",
                "UNVERIFIED_ACCOUNT",
                403);
        } var sessionId = Guid.NewGuid().ToString(); var refreshToken = Guid.NewGuid().ToString();
        await _redisService.SetAsync($"session:{refreshToken}", $"{user.Id}:{sessionId}", TimeSpan.FromDays(30));

        var storeStaff = await _context.StoreStaffs.FirstOrDefaultAsync(ss => ss.UserId == user.Id, ct);
        var token = _jwtProvider.GenerateJwtToken(user, sessionId, storeStaff?.StoreId);
        var roleCode = user.UserRoles.FirstOrDefault(ur => ur.Role != null && ur.Role.Code == AppConstants.Roles.Admin)?.Role?.Code ??
                       user.UserRoles.FirstOrDefault(ur => ur.Role != null && ur.Role.Code == AppConstants.Roles.Store)?.Role?.Code ??
                       user.UserRoles.FirstOrDefault(ur => ur.Role != null)?.Role?.Code ?? AppConstants.Roles.Customer;

        return new LoginResponse { AccessToken = token, UserId = user.Id, Email = user.Email, FullName = user.FullName, Role = roleCode, RefreshToken = refreshToken, StaffRole = storeStaff?.StaffRole };
    }

}
