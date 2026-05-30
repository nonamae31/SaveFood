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

// ─────────────────────────────────────────────────────────────────────────────
// TODO: Các thành viên sẽ đăng ký DI của tính năng mình vào đây.
// Ví dụ:
// builder.Services.AddScoped<IProductRepository, ProductRepository>();
// builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.ICartService, SaveFoodBackend.Services.CartService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IAuthService, SaveFoodBackend.Services.AuthService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IUserService, SaveFoodBackend.Services.UserService>();
builder.Services.AddScoped<SaveFoodBackend.Interfaces.IEmailService, SaveFoodBackend.Services.EmailService>();

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

builder.Services.AddHostedService<SaveFoodBackend.Services.BackgroundTasks.DynamicPricingBackgroundService>();
builder.Services.AddHostedService<SaveFoodBackend.Services.BackgroundTasks.ExpiredOrderCleanupService>();
builder.Services.AddHostedService<SaveFoodBackend.Services.BackgroundTasks.NoShowOrderCompletionService>();
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

// ─── 10. CORS & Routing (phải đứng TRƯỚC Authentication) ───────────────────
app.UseRouting();
app.UseCors("SaveFoodCors");

// ─── 11. Authentication & Authorization ──────────────────────────────────────
// TẠM THỜI VÔ HIỆU HÓA ĐỂ CÁC THÀNH VIÊN KHÁC DỄ DÀNG CODE/TEST MỌI ENDPOINT MÀ KHÔNG BỊ CHẶN LỖI 401/403.
app.UseAuthentication(); // Vẫn bật Authentication để đọc thông tin user từ Token/Cookie nếu có
app.UseAuthorization(); // RE-ENABLED: Kiểm tra phân quyền

// ─── 12. Controllers ─────────────────────────────────────────────────────────
app.MapControllers();

// ─────────────────────────────────────────────────────────────────────────────
// SignalR Hubs
app.MapHub<SaveFoodBackend.Hubs.NotificationHub>("/hubs/notifications");
// ─────────────────────────────────────────────────────────────────────────────

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SaveFoodDbContext>();
    // Auto-migrate schema for new columns Username and NormalizedEmail
    var sql = @"
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Users]') AND name = 'Username')
        BEGIN
            ALTER TABLE Users ADD Username nvarchar(50) NULL;
            ALTER TABLE Users ADD NormalizedEmail nvarchar(255) NULL;
        END
        
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Categories]') AND name = 'IsDeleted')
        BEGIN
            ALTER TABLE Categories ADD IsDeleted bit NOT NULL DEFAULT 0;
        END

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Stores]') AND name = 'LogoCloudinaryId')
        BEGIN
            ALTER TABLE Stores ADD LogoCloudinaryId nvarchar(max) NULL;
        END

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Stores]') AND name = 'CoverUrl')
        BEGIN
            ALTER TABLE Stores ADD CoverUrl nvarchar(max) NULL;
        END

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Stores]') AND name = 'CoverCloudinaryId')
        BEGIN
            ALTER TABLE Stores ADD CoverCloudinaryId nvarchar(max) NULL;
        END
    ";
    db.Database.ExecuteSqlRaw(sql);
    
    // Update existing records properly using AuthUtils
    var usersToUpdate = db.Users.ToList();
    bool anyChanges = false;
    foreach (var u in usersToUpdate)
    {
        var correctNormalized = SaveFoodBackend.Utils.AuthUtils.NormalizeEmail(u.Email);
        if (u.NormalizedEmail != correctNormalized)
        {
            u.NormalizedEmail = correctNormalized;
            anyChanges = true;
        }
        
        if (string.IsNullOrEmpty(u.Username))
        {
            var username = u.Email.Split('@')[0];
            username = new string(username.Where(c => char.IsLetterOrDigit(c) || c == '_').ToArray());
            if (username.Length < 3) username = username.PadRight(3, 'a');
            if (username.Length > 20) username = username.Substring(0, 20);
            u.Username = username;
            anyChanges = true;
        }
    }
    
    if (anyChanges)
    {
        db.SaveChanges();
    }
}

app.Run();
