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
builder.Services.AddSignalR();

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

// ─── 7. Redis Cache ───────────────────────────────────────────────────────────
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "SaveFood_";
});

// ─────────────────────────────────────────────────────────────────────────────
// TODO: Các thành viên sẽ đăng ký DI của tính năng mình vào đây.
// Ví dụ:
// builder.Services.AddScoped<IProductRepository, ProductRepository>();
// builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.ICartService, SaveFoodBackend.Services.CartService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IRedisService, SaveFoodBackend.Services.RedisService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IAuthService, SaveFoodBackend.Services.AuthService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IUserService, SaveFoodBackend.Services.UserService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IEmailService, SaveFoodBackend.Services.EmailService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IStoreFinanceService, SaveFoodBackend.Services.StoreFinanceService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.ICustomerWalletService, SaveFoodBackend.Services.CustomerWalletService>();

// Admin Repositories
builder.Services.AddScoped<SaveFoodBackend.Interfaces.Repositories.IUserRepository, SaveFoodBackend.Repositories.UserRepository>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.Repositories.IStoreRepository, SaveFoodBackend.Repositories.StoreRepository>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.Repositories.IFinanceRepository, SaveFoodBackend.Repositories.FinanceRepository>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.Repositories.ISubscriptionRepository, SaveFoodBackend.Repositories.SubscriptionRepository>();

// Admin Services
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IAdminService, SaveFoodBackend.Services.AdminService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.ISubscriptionPlanService, SaveFoodBackend.Services.SubscriptionPlanService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IAdminFinanceService, SaveFoodBackend.Services.AdminFinanceService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IAdminStatsService, SaveFoodBackend.Services.AdminStatsService>();

builder.Services.AddScoped<SaveFoodBackend.Interfaces.ICloudinaryService, SaveFoodBackend.Services.CloudinaryService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.Repositories.IProductRepository, SaveFoodBackend.Repositories.ProductRepository>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IProductService, SaveFoodBackend.Services.ProductService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.Repositories.IListingRepository, SaveFoodBackend.Repositories.ListingRepository>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IListingService, SaveFoodBackend.Services.ListingService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.ICustomerListingService, SaveFoodBackend.Services.CustomerListingService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.ICategoryService, SaveFoodBackend.Services.CategoryService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IStoreService, SaveFoodBackend.Services.StoreService>();
builder.Services.AddScoped<SaveFoodBackend.Services.IPayOSService, SaveFoodBackend.Services.PayOSService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IOrderService, SaveFoodBackend.Services.OrderService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.Repositories.IOrderRepository, SaveFoodBackend.Repositories.OrderRepository>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IStoreOrderService, SaveFoodBackend.Services.StoreOrderService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.Repositories.IReviewRepository, SaveFoodBackend.Repositories.ReviewRepository>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.Services.IReviewService, SaveFoodBackend.Services.ReviewService>();

// Staff management
builder.Services.AddScoped<SaveFoodBackend.Interfaces.Repositories.IStoreStaffRepository, SaveFoodBackend.Repositories.StoreStaffRepository>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IStoreStaffService, SaveFoodBackend.Services.StoreStaffService>();


builder.Services.AddHostedService<SaveFoodBackend.Services.BackgroundTasks.DynamicPricingBackgroundService>();
builder.Services.AddHostedService<SaveFoodBackend.Services.BackgroundTasks.ExpiredOrderCleanupService>();
builder.Services.AddHostedService<SaveFoodBackend.Services.BackgroundTasks.NoShowOrderCompletionService>();
// ─────────────────────────────────────────────────────────────────────────────

var app = builder.Build();

// ─── 7. Global Exception Middleware (PHẢI đứng đầu tiên trong pipeline) ───────
app.UseMiddleware<GlobalExceptionMiddleware>();

// ─── 8. Swagger UI (chỉ bật khi Development) ──────────────────────────────────
app.UseSwaggerWithUI();

// ─── 9. HTTPS Redirect ────────────────────────────────────────────────────────
app.UseHttpsRedirection();

// ─── 10. CORS & Routing (phải đứng TRƯỚC Authentication) ───────────────────
app.UseRouting();
app.UseCors("SaveFoodCors");

// ─── 11. Authentication & Authorization ──────────────────────────────────────
app.UseMiddleware<SaveFoodBackend.Middleware.JwtBlacklistMiddleware>();
app.UseAuthentication();
app.UseAuthorization();

// ─── 12. Controllers ─────────────────────────────────────────────────────────
app.MapControllers();

// ─────────────────────────────────────────────────────────────────────────────
// SignalR Hubs
app.MapHub<SaveFoodBackend.Hubs.NotificationHub>("/hubs/notifications");
// ─────────────────────────────────────────────────────────────────────────────


app.Run();
