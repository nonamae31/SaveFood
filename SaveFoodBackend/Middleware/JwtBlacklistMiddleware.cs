using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;
using SaveFoodBackend.Interfaces;
using System.Threading.Tasks;

namespace SaveFoodBackend.Middleware
{
    public class JwtBlacklistMiddleware
    {
        private readonly RequestDelegate _next;

        public JwtBlacklistMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context, IRedisService redisService)
        {
            var authHeader = context.Request.Headers[HeaderNames.Authorization].ToString();
            string token = null;

            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
            {
                token = authHeader.Substring("Bearer ".Length).Trim();
            }
            else
            {
                token = context.Request.Cookies["jwt"];
            }
            
            if (!string.IsNullOrEmpty(token))
            {
                var isBlacklisted = await redisService.IsTokenBlacklistedAsync(token);
                if (isBlacklisted)
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await context.Response.WriteAsync("Token has been revoked. Please log in again.");
                    return;
                }
            }

            await _next(context);
        }
    }
}
