using Microsoft.OpenApi.Models;

namespace SaveFoodBackend.Extensions;

/// <summary>
/// Extension methods đăng ký Swagger với hỗ trợ JWT Bearer Authorization.
/// Cho phép nhập token JWT trực tiếp vào Swagger UI để test các endpoint có [Authorize].
/// </summary>
public static class SwaggerExtensions
{
    public static IServiceCollection AddSwaggerWithJwt(this IServiceCollection services)
    {
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "SaveFood API",
                Version = "v1",
                Description = "API cho nền tảng SaveFood — Chợ thực phẩm cận date giá rẻ",
                Contact = new OpenApiContact
                {
                    Name = "SaveFood Team",
                    Email = "support@savefood.vn"
                }
            });

            // ─────────────────────────────────────────────────────────────────────────────
            // TẠM THỜI VÔ HIỆU HÓA HỘP NHẬP JWT TRÊN SWAGGER ĐỂ CODE/TEST DỄ DÀNG KHI CHƯA CÓ AUTH.
            // Khi làm Auth, người phụ trách chỉ cần BỎ COMMENT đoạn dưới đây là có lại nút "Authorize".
            // ─────────────────────────────────────────────────────────────────────────────
            /*
            // Thêm nút "Authorize" trên Swagger UI để nhập JWT Bearer Token
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Nhập token theo định dạng: Bearer {your_token}\nVí dụ: Bearer eyJhbGc..."
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
            */

            // Bao gồm XML comments (từ controller action comments) vào Swagger docs
            var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath))
                options.IncludeXmlComments(xmlPath);
        });

        return services;
    }

    public static IApplicationBuilder UseSwaggerWithUI(this IApplicationBuilder app)
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "SaveFood API v1");
            options.RoutePrefix = "swagger"; // Truy cập tại /swagger
            options.DocumentTitle = "SaveFood API";
            options.DisplayRequestDuration(); // Hiện thời gian response
        });
        return app;
    }
}
