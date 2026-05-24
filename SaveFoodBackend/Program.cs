using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Data;
using SaveFoodBackend.Extensions;
using SaveFoodBackend.Middleware;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.IdentityModel.Tokens.Jwt;

var builder = WebApplication.CreateBuilder(args);

// Tắt tự động map claim (sub -> nameidentifier) của .NET để giữ nguyên claim chuẩn của JWT
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

// ─── 1. Controllers & API ─────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ─── 2. Swagger với JWT Support ───────────────────────────────────────────────
builder.Services.AddSwaggerWithJwt();

// ─── 3. Database Context (SQL Server) ─────────────────────────────────────────
builder.Services.AddDbContext<SaveFoodDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions => sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorNumbersToAdd: null
        )
    )
);

// ─── 4. Authentication (JWT) & Authorization ──────────────────────────────────
builder.Services.AddJwtAuthentication(builder.Configuration);

// ─── 5. CORS Policy ───────────────────────────────────────────────────────────
builder.Services.AddSaveFoodCors(builder.Configuration);

// ─── 6. HTTP Context Accessor (dùng trong Services nếu cần) ───────────────────
builder.Services.AddHttpContextAccessor();

// ─────────────────────────────────────────────────────────────────────────────
// TODO: Các thành viên sẽ đăng ký DI của tính năng mình vào đây.
// Ví dụ:
// builder.Services.AddScoped<IProductRepository, ProductRepository>();
// builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IAuthService, SaveFoodBackend.Services.AuthService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IUserService, SaveFoodBackend.Services.UserService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IEmailService, SaveFoodBackend.Services.EmailService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.ICloudinaryService, SaveFoodBackend.Services.CloudinaryService>();
// ─────────────────────────────────────────────────────────────────────────────

var app = builder.Build();

// ─── 7. Global Exception Middleware (PHẢI đứng đầu tiên trong pipeline) ───────
app.UseMiddleware<GlobalExceptionMiddleware>();

// ─── 8. Swagger UI (chỉ bật khi Development) ──────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwaggerWithUI();
}

// ─── 9. HTTPS Redirect ────────────────────────────────────────────────────────
app.UseHttpsRedirection();

// ─── 10. CORS (phải đứng TRƯỚC Authentication) ───────────────────────────────
app.UseCors("SaveFoodCors");

// ─── 11. Authentication & Authorization ──────────────────────────────────────
// TẠM THỜI VÔ HIỆU HÓA ĐỂ CÁC THÀNH VIÊN KHÁC DỄ DÀNG CODE/TEST MỌI ENDPOINT MÀ KHÔNG BỊ CHẶN LỖI 401/403.
app.UseAuthentication(); // Vẫn bật Authentication để đọc thông tin user từ Token/Cookie nếu có
// app.UseAuthorization(); // COMMENT LẠI THEO YÊU CẦU: Bypass kiểm tra phân quyền để không bị block (401/403)

// ─── 12. Controllers ─────────────────────────────────────────────────────────
app.MapControllers();

// ─────────────────────────────────────────────────────────────────────────────
// TODO: SignalR Hub (Người 4 đăng ký tại đây)
// app.MapHub<NotificationHub>("/hubs/notifications");
// ─────────────────────────────────────────────────────────────────────────────

app.Run();
