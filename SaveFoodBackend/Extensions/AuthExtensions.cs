using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace SaveFoodBackend.Extensions;

/// <summary>
/// Extension methods đăng ký JWT Authentication.
/// Đọc cấu hình từ appsettings.json section "Jwt".
/// </summary>
public static class AuthExtensions
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        // ─────────────────────────────────────────────────────────────────────────────
        // TẠM THỜI VÔ HIỆU HÓA JWT ĐỂ CÁC THÀNH VIÊN KHÁC KHÔNG BỊ CHẶN KHI CODE & TEST API.
        // Người đảm nhận chức năng Auth chỉ cần BỎ COMMENT đoạn code dưới đây là kích hoạt lại.
        // ─────────────────────────────────────────────────────────────────────────────
        /*
        var jwtSettings = configuration.GetSection("Jwt");
        var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ClockSkew = TimeSpan.Zero // Không cho phép dung sai thời gian — token hết hạn là hết ngay
            };

            // Hỗ trợ JWT từ query string cho SignalR WebSocket connection
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = ctx =>
                {
                    var accessToken = ctx.Request.Query["access_token"];
                    var path = ctx.HttpContext.Request.Path;
                    // Chỉ đọc token từ query string khi kết nối đến SignalR hub
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                        ctx.Token = accessToken;
                    return Task.CompletedTask;
                }
            };
        });
        */

        // Đăng ký dịch vụ Authorization mặc định (không yêu cầu JWT Bearer tạm thời)
        services.AddAuthorization();

        return services;
    }

    /// <summary>
    /// Cấu hình CORS policy cho phép Frontend React kết nối.
    /// Origins cụ thể được đọc từ appsettings.json section "AllowedOrigins".
    /// </summary>
    public static IServiceCollection AddSaveFoodCors(this IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = configuration.GetSection("AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:5173", "http://localhost:3000"];

        services.AddCors(options =>
        {
            options.AddPolicy("SaveFoodCors", policy =>
            {
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials(); // Cần cho SignalR WebSocket
            });
        });

        return services;
    }
}
