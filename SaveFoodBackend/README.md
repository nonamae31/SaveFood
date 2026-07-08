# SaveFood Backend

Dự án **SaveFood** là nền tảng Web Marketplace chuyên bán đồ ăn cận date nhằm mục đích giảm thiểu lãng phí thực phẩm. Đây là mã nguồn Backend (API) của hệ thống.

Dự án này áp dụng mô hình **CQRS (Command Query Responsibility Segregation)** kết hợp **MediatR**, cùng với mẫu thiết kế **Repository & Unit of Work**, hướng tới Clean Architecture để tách biệt rõ ràng các tầng nghiệp vụ và dễ dàng mở rộng.

---

## 1. Công nghệ sử dụng
- **Framework**: .NET 8 (ASP.NET Core Web API)
- **Database**: SQL Server
- **ORM**: Entity Framework Core 8.0
- **Architecture Patterns**: CQRS (MediatR), Unit of Work, Repository Pattern
- **Authentication**: JWT (JSON Web Tokens)
- **Caching & OTP**: Redis
- **Thanh toán**: payOS
- **Lưu trữ ảnh**: Cloudinary
- **Gửi Email**: MailKit (SMTP)
- **Real-time**: SignalR (WebSockets)

---

## 2. Các Module và Bảng dữ liệu cốt lõi
Hệ thống được chia thành các phân hệ chính sau:

1. **Phân hệ Người dùng & Xác thực (Auth & Users)**: `Users`, `Roles`, `UserRoles`, `UserSessions`, `PasswordResetTokens`, `EmailVerifications`.
2. **Phân hệ Cửa hàng (Stores)**: `Stores`, `StoreStaffs` (Quản lý nhân viên quán), `SubscriptionPlans` (Gói cước), `StoreSubscriptions` (Đăng ký gói).
3. **Phân hệ Sản phẩm & Tin đăng (Products & Listings)**: `Categories`, `Products`, `ProductImages`, `ClearanceListings` (Lô hàng cận date thực tế bán), `ListingImages`, `ListingDiscountRules` (Cấu hình tự động giảm giá cận giờ).
4. **Phân hệ Đặt hàng (Orders)**: `Carts`, `CartItems` (Giỏ hàng), `Orders`, `OrderItems` (Chi tiết đơn), `Payments` (Thanh toán).
5. **Phân hệ Tài chính & Ví (Wallets)**: `StoreWallets`, `CustomerWallets`, `WalletTransactions`, `CustomerWalletTransactions`, `WithdrawalRequests` (Yêu cầu rút tiền).
6. **Phân hệ Đánh giá (Reviews)**: `Reviews`, `ReviewImages` (Khách hàng đánh giá đơn).
7. **Phân hệ Thông báo (Notifications)**: `Notifications` (Quản lý thông báo in-app realtime).

---

## 3. Các Background Tasks (Tiến trình chạy ngầm)
- `DynamicPricingBackgroundService`: Tự động quét và giảm giá (`SalePrice`) các tin đăng (ClearanceListing) dựa vào `ListingDiscountRules` khi gần đến giờ hết hạn.
- `ExpiredOrderCleanupService`: Tự động hủy các đơn hàng chưa thanh toán quá hạn (Pending payment timeout).
- `NoShowOrderCompletionService`: Tự động đánh dấu hoàn thành các đơn đã thanh toán online nhưng khách không đến lấy (No Show) sau khoảng thời gian nhất định, để tránh tiền bị treo.

---

## 4. Hướng dẫn Cài đặt & Chạy dự án

### Yêu cầu hệ thống (Prerequisites)
- Cài đặt [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0).
- Cài đặt [SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) và SSMS (hoặc Azure Data Studio).
- Cài đặt [Redis](https://redis.io/download/) (Chạy qua Docker hoặc cài trực tiếp).
- Cài đặt EF Core CLI: `dotnet tool install --global dotnet-ef`

### Cấu hình môi trường (appsettings.json)
Bạn cần cấu hình file `appsettings.json` (hoặc `appsettings.Development.json`) trước khi chạy:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=SaveFoodDB_MVP;Trusted_Connection=True;TrustServerCertificate=True;",
    "Redis": "localhost:6379"
  },
  "AllowedOrigins": [
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  "Jwt": {
    "Key": "SaveFood_Super_Secret_Key_For_JWT_Authentication_12345!@#",
    "Issuer": "SaveFoodBackend",
    "Audience": "SaveFoodFrontend"
  }
  // Các cấu hình SmtpSettings, Google, Cloudinary, PayOS...
}
```

### Chạy Database Migration
Vì dự án dùng Entity Framework Core, bạn cần cập nhật CSDL:

```bash
# Trỏ đường dẫn vào thư mục chứa project
cd SaveFoodBackend

# Chạy lệnh update database
dotnet ef database update
```

### Khởi chạy Server
Để chạy API Server:

```bash
dotnet run
```
Truy cập `https://localhost:<port>/swagger` để xem giao diện tài liệu API (Swagger UI). Lưu ý SignalR sẽ lắng nghe tại endpoint `/hubs/notifications`.

---

## 5. Cấu trúc thư mục (CQRS & Clean Architecture)

- **`/Application`**: Tầng trung tâm chứa các Business Use Cases được chia theo mô hình **CQRS** (`Commands` và `Queries`). Các Handler xử lý nghiệp vụ thông qua `MediatR` (Ví dụ: `CheckoutCommand`, `GetMyOrdersQuery`).
- **`/Controllers`**: Chứa các API Endpoints. Controller hiện tại cực kỳ mỏng, chỉ nhận request, thực thi Command/Query qua `IMediator.Send()`, và trả về kết quả.
- **`/Interfaces`**: Định nghĩa các Interface hợp đồng cho Repository, Service và Unit of Work, tuân thủ Dependency Inversion (DI).
- **`/Repositories`**: Nơi thao tác trực tiếp với `DbContext`. Che giấu (Abstract) việc truy xuất Data khỏi Application Layer.
- **`/Data`**: Chứa `SaveFoodDbContext` và `UnitOfWork` để quản lý Transaction tập trung.
- **`/Services`**: Chứa các logic phụ trợ hoặc tích hợp với 3rd-party không liên quan trực tiếp đến business flow chính của hệ thống.
- **`/Models`**: File entities ánh xạ với bảng SQL Server. 
- **`/DTOs`**: Chứa các class Data Transfer Object định nghĩa Request/Response Payload cho API.
- **`/BackgroundTasks`**: Chứa các HostedServices (Workers) chạy định kỳ hoặc liên tục.
- **`/Hubs`**: Cấu hình WebSockets (SignalR) bắn thông báo thời gian thực.
- **`/Middleware`**: Chứa `GlobalExceptionMiddleware` để bắt lỗi toàn cục và format chuẩn API Response.

---

## 6. Sơ đồ Thực thể - Liên kết (ERD Diagram)

```mermaid
erDiagram
    User ||--o{ UserRole : has
    Role ||--o{ UserRole : mapped_to
    User ||--o{ UserSession : owns
    User ||--o{ Order : places
    Store ||--o{ Product : sells
    Category ||--o{ Product : categorizes
    Store ||--o{ Order : receives
    Order ||--o{ OrderItem : contains
    Product ||--o{ ClearanceListing : "listed as"
    ClearanceListing ||--o{ OrderItem : "sold as"

    User {
        uniqueidentifier Id PK
        nvarchar Email
        nvarchar FullName
    }
    Role {
        uniqueidentifier Id PK
        nvarchar Code
    }
    UserSession {
        uniqueidentifier Id PK
        uniqueidentifier UserId FK
    }
    Store {
        uniqueidentifier Id PK
        nvarchar Name
    }
    Product {
        uniqueidentifier Id PK
        nvarchar Name
    }
    Category {
        uniqueidentifier Id PK
        nvarchar Name
    }
    Order {
        uniqueidentifier Id PK
        decimal TotalAmount
    }
```
