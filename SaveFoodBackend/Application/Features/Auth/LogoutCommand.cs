using System;
using System.IdentityModel.Tokens.Jwt;
using System.Threading;
using System.Threading.Tasks;
using SaveFood.Application.CQRS;
using SaveFoodBackend.Interfaces;

namespace SaveFood.Application.Features.Auth;

public class LogoutCommand : ICommand<bool>
{
    public string AccessToken { get; set; }
    public string RefreshToken { get; set; }
    public LogoutCommand(string accessToken, string refreshToken) { AccessToken = accessToken; RefreshToken = refreshToken; }
}

public class LogoutCommandHandler : ICommandHandler<LogoutCommand, bool>
{
    private readonly IRedisService _redisService;

    public LogoutCommandHandler(IRedisService redisService)
    {
        _redisService = redisService;
    }

    public async Task<bool> Handle(LogoutCommand command, CancellationToken ct)
    {
        if (!string.IsNullOrEmpty(command.RefreshToken)) await _redisService.DeleteAsync($"session:{command.RefreshToken}");
        
        if (!string.IsNullOrEmpty(command.AccessToken))
        {
            var handler = new JwtSecurityTokenHandler();
            if (handler.CanReadToken(command.AccessToken))
            {
                var jwtToken = handler.ReadJwtToken(command.AccessToken);
                var remainingTime = jwtToken.ValidTo - DateTime.UtcNow;
                if (remainingTime > TimeSpan.Zero) await _redisService.SetTokenBlacklistAsync(command.AccessToken, remainingTime);
            }
        }
        return true;
    }
}
