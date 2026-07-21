# 🌿 SaveFood — Food Rescue E-commerce Platform

> **Nền tảng thương mại điện tử kết nối cửa hàng thực phẩm với khách hàng, giúp giảm thiểu lãng phí thực phẩm thông qua việc bán các sản phẩm gần hết hạn với giá ưu đãi.**

---

## 📋 Mục lục

- [Tổng quan dự án](#tổng-quan-dự-án)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Hướng dẫn cài đặt & chạy Local](#hướng-dẫn-cài-đặt--chạy-local)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Cài đặt Redis (Docker)](#2-cài-đặt-redis-docker)
  - [3. Backend (.NET 8)](#3-backend-net-8)
  - [4. Frontend (React + Vite)](#4-frontend-react--vite)
- [Cấu hình môi trường](#cấu-hình-môi-trường)
  - [Backend appsettings](#backend-appsettings)
  - [Frontend .env](#frontend-env)
- [🚀 Hướng dẫn Deploy Production](DEPLOY.md) _(xem file riêng DEPLOY.md)_
- [Database Migrations](#database-migrations)
- [Tài khoản mặc định](#tài-khoản-mặc-định)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)

---

## Tổng quan dự án

SaveFood là một nền tảng thương mại điện tử **3-sided marketplace** với ba loại người dùng:

| Vai trò | Mô tả |
|---|---|
| **Customer** | Tìm kiếm, mua hàng, đánh giá sản phẩm gần hết hạn |
| **Store** | Đăng ký, quản lý cửa hàng, tạo Clearance Listings |
| **Admin** | Quản trị toàn bộ nền tảng, duyệt cửa hàng, quản lý tài chính |

**Tính năng nổi bật:**
- 🛒 Giỏ hàng server-side, tách đơn theo từng cửa hàng khi checkout
- 💳 Thanh toán qua **PayOS** (QR banking) hoặc **Ví SaveFood**
- 📦 Quy trình pickup code — xác nhận nhận hàng tại quầy
- 📊 Dashboard phân tích cho Store và Admin
- 🔔 Real-time notifications qua **SignalR**
- 🗺️ Tìm kiếm theo vị trí địa lý (Haversine distance)
- 🤖 Gợi ý cá nhân hóa bằng AI (Gemini)
- 💬 Hệ thống khiếu nại real-time (Complaint Chat)
- 💰 Hệ thống cashback voucher 2% cho khách hàng

---

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND                              │
│          React 19 + TypeScript + Vite + TailwindCSS         │
│              Deploy: Vercel (save-food-black.vercel.app)    │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS / WebSocket
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND                               │
│            ASP.NET Core 8 Web API + SignalR                 │
│          Architecture: MediatR (CQRS) + Repository          │
│         Deploy: hungkieupp-001-site1.ltempurl.com           │
└──────────┬──────────────────┬───────────────────────────────┘
           │                  │
           ▼                  ▼
┌──────────────────┐  ┌──────────────────────┐
│   SQL Server     │  │   Redis (Cache)       │
│  (SQL4Now.net)   │  │  (adorable-cattle...) │
│  db_acc197_hungk │  │   Port 10875          │
└──────────────────┘  └──────────────────────┘
```

**Luồng thanh toán:**
```
Frontend → Backend → PayOS → Webhook → Backend (cập nhật trạng thái) → SignalR → Frontend
```

---

## Công nghệ sử dụng

### Backend
| Thành phần | Công nghệ |
|---|---|
| Framework | ASP.NET Core 8 Web API |
| ORM | Entity Framework Core 8 |
| Database | SQL Server |
| Cache | Redis (StackExchange.Redis) |
| Auth | JWT Bearer + Google OAuth |
| Real-time | SignalR |
| CQRS | MediatR 14 |
| Email | MailKit (SMTP Gmail) |
| Image Upload | Cloudinary |
| Payment | PayOS |
| AI | Google Gemini |

### Frontend
| Thành phần | Công nghệ |
|---|---|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | TailwindCSS 4 |
| State Management | TanStack Query (React Query) |
| Routing | React Router DOM 7 |
| Forms | React Hook Form + Zod |
| Real-time | @microsoft/signalr |
| Maps | Leaflet + React Leaflet |
| Charts | Recharts |
| Auth | @react-oauth/google |

---

## Yêu cầu môi trường

| Phần mềm | Phiên bản tối thiểu | Ghi chú |
|---|---|---|
| **.NET SDK** | 8.0+ | `dotnet --version` |
| **Node.js** | 18+ | `node --version` |
| **npm** | 8+ | `npm --version` |
| **Docker** | 20+ | Dùng để chạy Redis |
| **SQL Server** | 2019+ | LocalDB hoặc full instance |
| **Git** | Bất kỳ | Clone repo |

---

## Hướng dẫn cài đặt & chạy Local

### 1. Clone Repository

```bash
git clone <repo-url>
cd SaveFood
```

### 2. Cài đặt Redis (Docker)

Redis là bắt buộc để chạy ứng dụng (dùng cho cache Listings).

```bash
# Khởi động Redis bằng Docker Compose
docker-compose up -d

# Kiểm tra Redis đang chạy
docker ps
# Nên thấy: savefood-redis  redis:7-alpine  0.0.0.0:6379->6379/tcp
```

> **Lưu ý:** Nếu không có Docker, có thể cài Redis trực tiếp trên Windows bằng [Memurai](https://www.memurai.com/) hoặc [Redis for Windows](https://github.com/microsoftarchive/redis/releases).

### 3. Backend (.NET 8)

```bash
cd SaveFoodBackend

# Restore NuGet packages
dotnet restore

# Kiểm tra file appsettings.Development.json đã có đúng connection string chưa
# (xem phần Cấu hình môi trường bên dưới)

# Chạy migrations để tạo database
dotnet ef database update

# Khởi động server (HTTPS: port 7251, HTTP: port 5041)
dotnet run
```

API sẽ có sẵn tại:
- **Swagger UI:** `https://localhost:7251/swagger`
- **API Base:** `https://localhost:7251/api`
- **SignalR Hub:** `https://localhost:7251/hubs/notifications`

### 4. Frontend (React + Vite)

```bash
cd frontend

# Cài đặt dependencies
npm install

# Tạo file .env.local từ template
copy .env.example .env.local
# Hoặc trên Linux/Mac:
# cp .env.example .env.local

# Chỉnh sửa .env.local (xem phần Cấu hình môi trường)
# VITE_API_BASE_URL=https://localhost:7251/api

# Khởi động dev server
npm run dev
```

Frontend sẽ có sẵn tại: `http://localhost:5173`

---

## Cấu hình môi trường

### Backend appsettings

**`appsettings.Development.json`** (chỉ chứa override cho local):

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=SaveFoodDB_MVP;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true;"
  },
  "PayOS": {
    "ReturnUrl": "http://localhost:5173/checkout/success",
    "CancelUrl":  "http://localhost:5173/checkout/cancel"
  },
  "Frontend": {
    "BaseUrl": "http://localhost:5173"
  }
}
```

**Các key quan trọng trong `appsettings.json`** (cần cấu hình cho production):

| Key | Mô tả |
|---|---|
| `ConnectionStrings:DefaultConnection` | Connection string SQL Server |
| `ConnectionStrings:Redis` | Connection string Redis (`host:port,password=xxx`) |
| `Jwt:Key` | JWT Secret Key (tối thiểu 32 ký tự) |
| `Jwt:Issuer` | JWT Issuer |
| `Jwt:Audience` | JWT Audience |
| `Google:ClientId` | Google OAuth Client ID |
| `Cloudinary:CloudName` | Tên Cloudinary cloud |
| `Cloudinary:ApiKey` | Cloudinary API Key |
| `Cloudinary:ApiSecret` | Cloudinary API Secret |
| `PayOS:ClientId` | PayOS Client ID |
| `PayOS:ApiKey` | PayOS API Key |
| `PayOS:ChecksumKey` | PayOS Checksum Key |
| `PayOS:ReturnUrl` | URL redirect sau thanh toán thành công |
| `PayOS:CancelUrl` | URL redirect khi hủy thanh toán |
| `SmtpSettings:*` | Cấu hình SMTP gửi email |
| `Gemini:ApiKey` | Gemini AI API Key |
| `AllowedOrigins` | Danh sách domain CORS cho phép |
| `PlatformConfig:AdminFeePercentage` | Phí nền tảng (mặc định: 0.05 = 5%) |
| `PlatformConfig:CustomerCashbackPercentage` | Cashback voucher (mặc định: 0.02 = 2%) |

### Frontend .env

**`frontend/.env.local`** (không commit lên Git):

```env
# URL API Backend
VITE_API_BASE_URL=https://localhost:7251/api
```

**`frontend/.env.production`** (cho production build):

```env
VITE_API_BASE_URL=https://hungkieupp-001-site1.ltempurl.com/api
```

---

## 🚀 Hướng dẫn Deploy Production

> Hướng dẫn deploy chi tiết đã được tách thành file riêng:
>
> **👉 Xem [DEPLOY.md](DEPLOY.md)**
>
> Bao gồm: IIS, Docker, Azure App Service, Vercel, PayOS Webhook, CORS, Database Migrations, Troubleshooting.

---

## Database Migrations

```bash
cd SaveFoodBackend

# Xem danh sách migrations
dotnet ef migrations list

# Tạo migration mới
dotnet ef migrations add <MigrationName>

# Áp dụng migrations vào database
dotnet ef database update

# Rollback về migration cụ thể
dotnet ef database update <MigrationName>

# Xóa migration gần nhất (chưa apply)
dotnet ef migrations remove
```

> **Lưu ý:** Khi deploy lên production, chạy `dotnet ef database update` trước khi khởi động ứng dụng.

---

## Tài khoản mặc định

Sau khi seed database, có thể dùng các tài khoản sau để test:

| Email | Password | Role |
|---|---|---|
| `admin@savefood.vn` | `Admin@123` | Admin |
| Tạo qua `/register` | Tự đặt | Customer |
| Tạo qua dashboard Admin | Tự đặt | Store |

---

## Cấu trúc thư mục

```
SaveFood/
├── SaveFoodBackend/              # ASP.NET Core 8 Web API
│   ├── Application/              # CQRS Commands & Queries (MediatR)
│   │   ├── Auth/                 # Register, Login, GoogleLogin, OTP, JWT...
│   │   ├── Orders/               # Checkout, Payment, Cancel, ConfirmReceipt...
│   │   ├── StoreOrders/          # Confirm, MarkReady, Complete, Cancel (Store side)
│   │   ├── Features/             # Listings, Products, Complaints, Finance...
│   │   └── ...
│   ├── Controllers/              # API Controllers (REST endpoints)
│   │   ├── Customer/             # CustomerWallet, Reviews, Complaints, Voucher
│   │   ├── Store/                # StoreFinance, StoreReviews
│   │   ├── UsersController.cs    # Auth: register, login, profile, location
│   │   ├── OrdersController.cs   # Customer orders
│   │   ├── StoreOrdersController.cs # Store order management
│   │   ├── ListingsController.cs # Store: Clearance Listings CRUD
│   │   ├── ProductsController.cs # Store: Product CRUD
│   │   ├── StoresController.cs   # Stores browse + registration
│   │   ├── CartsController.cs    # Cart management
│   │   ├── PaymentsController.cs # PayOS webhook + verify
│   │   ├── NotificationsController.cs
│   │   ├── AdminController.cs    # Admin: users, stores management
│   │   ├── AdminFinanceController.cs
│   │   ├── AdminAuditController.cs
│   │   └── ...
│   ├── Data/                     # EF Core DbContext
│   ├── Models/                   # Domain entities
│   ├── DTOs/                     # Data Transfer Objects
│   ├── Services/                 # Business logic services
│   ├── Repositories/             # Data access layer
│   ├── Hubs/                     # SignalR Hubs (Notification, Complaint)
│   ├── Migrations/               # EF Core migrations
│   ├── Middleware/               # Custom middleware
│   └── Program.cs                # App entry point & DI configuration
│
├── frontend/                     # React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── pages/               # Route pages (Home, Cart, Orders, Dashboard...)
│   │   ├── components/          # Reusable UI components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API service layer (Axios)
│   │   ├── contexts/            # React contexts
│   │   └── types/               # TypeScript type definitions
│   ├── public/                  # Static assets
│   ├── .env.example             # Template environment variables
│   └── vite.config.ts
│
├── document/                    # Tài liệu dự án
│   └── Api_specification.md     # API documentation
│
├── docker-compose.yml           # Redis container
├── CONTEXT.md                   # Domain language documentation
└── README.md                    # File này
```

---

## 🔗 Links

| Môi trường | URL |
|---|---|
| Frontend Production | https://save-food-black.vercel.app |
| Backend Production | https://hungkieupp-001-site1.ltempurl.com |
| Swagger UI (Production) | https://hungkieupp-001-site1.ltempurl.com/swagger |
| Frontend Dev | http://localhost:5173 |
| Backend Dev | https://localhost:7251 |
| Swagger UI (Dev) | https://localhost:7251/swagger |

---

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/ten-tinh-nang`
3. Commit changes: `git commit -m 'feat: thêm tính năng X'`
4. Push branch: `git push origin feature/ten-tinh-nang`
5. Tạo Pull Request

---

*SaveFood — Giảm lãng phí, tăng giá trị 🌱*
