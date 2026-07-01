using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SaveFood.Application.CQRS;
using SaveFoodBackend.Data;
using SaveFoodBackend.DTOs.Auth;
using SaveFoodBackend.Interfaces;
using SaveFoodBackend.Utils;
using SaveFoodBackend.Common.Constants;

namespace SaveFood.Application.Features.Auth;

public class GoogleLoginCommand : ICommand<LoginResponse>
{
    public GoogleLoginRequest Request { get; set; }
    public GoogleLoginCommand(GoogleLoginRequest request) => Request = request;
}

public class GoogleLoginCommandHandler : ICommandHandler<GoogleLoginCommand, LoginResponse>
{
    private readonly SaveFoodDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IRedisService _redisService;
    private readonly IJwtProvider _jwtProvider;

    public GoogleLoginCommandHandler(SaveFoodDbContext context, IConfiguration configuration, IRedisService redisService, IJwtProvider jwtProvider)
    {
        _context = context; _configuration = configuration; _redisService = redisService; _jwtProvider = jwtProvider;
    }

    public async Task<LoginResponse> Handle(GoogleLoginCommand command, CancellationToken ct)
    {
        var request = command.Request;
        var clientId = _configuration["Google:ClientId"];
        if (string.IsNullOrEmpty(clientId)) throw new InvalidOperationException("Google ClientId is not configured.");

        string payloadEmail = null, payloadName = null, payloadPicture = null;
        var settings = new GoogleJsonWebSignature.ValidationSettings() { Audience = new[] { clientId }, ExpirationTimeClockTolerance = TimeSpan.FromMinutes(5), IssuedAtClockTolerance = TimeSpan.FromMinutes(5) };

        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.Token, settings);
            payloadEmail = payload.Email; payloadName = payload.Name; payloadPicture = payload.Picture;
        }
        catch (InvalidJwtException ex)
        {
            using var httpClient = new System.Net.Http.HttpClient();
            httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", request.Token);
            var response = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo", ct);
            if (!response.IsSuccessStatusCode) throw new UnauthorizedAccessException($"Invalid Google Token. JWT Error: {ex.Message}");

            var json = await response.Content.ReadAsStringAsync(ct);
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("email", out var emailProp)) payloadEmail = emailProp.GetString();
            if (doc.RootElement.TryGetProperty("name", out var nameProp)) payloadName = nameProp.GetString();
            if (doc.RootElement.TryGetProperty("picture", out var picProp)) payloadPicture = picProp.GetString();
        }

        if (string.IsNullOrEmpty(payloadEmail)) throw new UnauthorizedAccessException("Could not retrieve email from Google Token.");
        var normalizedEmail = AuthUtils.NormalizeEmail(payloadEmail);
        var user = await _context.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role).FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, ct);

        if (user == null)
        {
            var username = payloadEmail.Split('@')[0];
            username = new string(username.Where(c => char.IsLetterOrDigit(c) || c == '_').ToArray());
            if (username.Length < 3) username = username.PadRight(3, 'a');
            if (username.Length > 20) username = username.Substring(0, 20);
            if (await _context.Users.AnyAsync(u => u.Username == username, ct)) username = username.Substring(0, Math.Min(15, username.Length)) + new Random().Next(1000, 9999);

            user = new SaveFoodBackend.Models.User { Id = Guid.NewGuid(), Email = payloadEmail, NormalizedEmail = normalizedEmail, Username = username, FullName = payloadName ?? payloadEmail, PasswordHash = Guid.NewGuid().ToString(), AvatarUrl = payloadPicture, UserStatusEnum = SaveFoodBackend.Models.Enums.UserStatus.Active, EmailVerified = true, CreatedAt = DateTime.UtcNow };
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Code == "Customer" || r.Name == "Customer", ct);
            if (role != null) user.UserRoles.Add(new SaveFoodBackend.Models.UserRole { RoleId = role.Id, UserId = user.Id });
            _context.Users.Add(user);
        }
        else
        {
            if (user.UserStatusEnum != SaveFoodBackend.Models.Enums.UserStatus.Active) throw new UnauthorizedAccessException("Account is locked or inactive.");
            if (string.IsNullOrEmpty(user.AvatarUrl) && !string.IsNullOrEmpty(payloadPicture)) user.AvatarUrl = payloadPicture;
            if (!user.EmailVerified) user.EmailVerified = true;
        }

        var sessionId = Guid.NewGuid().ToString(); var refreshToken = Guid.NewGuid().ToString();
        await _redisService.SetAsync($"session:{refreshToken}", $"{user.Id}:{sessionId}", TimeSpan.FromDays(30));

        var token = _jwtProvider.GenerateJwtToken(user, sessionId);
        var roleCode = user.UserRoles.Any(ur => ur.Role != null && ur.Role.Code == AppConstants.Roles.Admin) ? AppConstants.Roles.Admin :
                       user.UserRoles.Any(ur => ur.Role != null && ur.Role.Code == AppConstants.Roles.Store) ? AppConstants.Roles.Store :
                       user.UserRoles.FirstOrDefault(ur => ur.Role != null)?.Role?.Code ?? AppConstants.Roles.Customer;

        var storeStaff = await _context.StoreStaffs.FirstOrDefaultAsync(ss => ss.UserId == user.Id, ct);
        return new LoginResponse { AccessToken = token, UserId = user.Id, Email = user.Email, FullName = user.FullName, Role = roleCode, RefreshToken = refreshToken, StaffRole = storeStaff?.StaffRole };
    }
}
