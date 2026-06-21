USE [db_acaeb7_savefooddb]
GO
/****** Object:  Table [dbo].[CartItems]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CartItems](
	[Id] [uniqueidentifier] NOT NULL,
	[CartId] [uniqueidentifier] NOT NULL,
	[ListingId] [uniqueidentifier] NOT NULL,
	[Quantity] [int] NOT NULL,
 CONSTRAINT [PK_CartItems] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Carts]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Carts](
	[Id] [uniqueidentifier] NOT NULL,
	[UserId] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_Carts] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Categories]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Categories](
	[Id] [uniqueidentifier] NOT NULL,
	[Name] [nvarchar](100) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[IsDeleted] [bit] NOT NULL,
 CONSTRAINT [PK_Categories] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ClearanceListings]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ClearanceListings](
	[Id] [uniqueidentifier] NOT NULL,
	[ProductId] [uniqueidentifier] NOT NULL,
	[Title] [nvarchar](250) NOT NULL,
	[SalePrice] [decimal](18, 2) NOT NULL,
	[QuantityAvailable] [int] NOT NULL,
	[ExpiryDate] [datetime2](7) NOT NULL,
	[Status] [tinyint] NOT NULL,
	[ListingFlags] [tinyint] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_ClearanceListings] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CustomerWallets]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CustomerWallets](
	[Id] [uniqueidentifier] NOT NULL,
	[UserId] [uniqueidentifier] NOT NULL,
	[Balance] [decimal](18, 2) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_CustomerWallets] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CustomerWalletTransactions]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CustomerWalletTransactions](
	[Id] [uniqueidentifier] NOT NULL,
	[CustomerWalletId] [uniqueidentifier] NOT NULL,
	[Amount] [decimal](18, 2) NOT NULL,
	[Type] [tinyint] NOT NULL,
	[Status] [tinyint] NOT NULL,
	[OrderId] [uniqueidentifier] NULL,
	[Description] [nvarchar](500) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[ReferenceId] [uniqueidentifier] NULL,
 CONSTRAINT [PK_CustomerWalletTransactions] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EmailVerifications]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EmailVerifications](
	[Id] [uniqueidentifier] NOT NULL,
	[UserId] [uniqueidentifier] NOT NULL,
	[VerificationCode] [nvarchar](20) NOT NULL,
	[ExpiresAt] [datetime2](7) NOT NULL,
	[VerifiedAt] [datetime2](7) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_EmailVerifications] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ListingDiscountRules]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ListingDiscountRules](
	[Id] [uniqueidentifier] NOT NULL,
	[ListingId] [uniqueidentifier] NOT NULL,
	[RuleOrder] [int] NOT NULL,
	[DiscountPercent] [decimal](5, 2) NULL,
	[TargetPrice] [decimal](18, 2) NULL,
	[TriggerValue] [int] NOT NULL,
	[TriggerType] [tinyint] NOT NULL,
	[RuleFlags] [tinyint] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_ListingDiscountRules] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ListingImages]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ListingImages](
	[Id] [uniqueidentifier] NOT NULL,
	[ListingId] [uniqueidentifier] NOT NULL,
	[ImageUrl] [nvarchar](500) NOT NULL,
	[ImageFlags] [tinyint] NOT NULL,
	[CloudinaryPublicId] [nvarchar](max) NULL,
 CONSTRAINT [PK_ListingImages] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[OrderItems]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[OrderItems](
	[Id] [uniqueidentifier] NOT NULL,
	[OrderId] [uniqueidentifier] NOT NULL,
	[ListingId] [uniqueidentifier] NOT NULL,
	[ProductNameSnapshot] [nvarchar](250) NOT NULL,
	[UnitPriceSnapshot] [decimal](18, 2) NOT NULL,
	[Quantity] [int] NOT NULL,
 CONSTRAINT [PK_OrderItems] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Orders]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Orders](
	[Id] [uniqueidentifier] NOT NULL,
	[UserId] [uniqueidentifier] NOT NULL,
	[StoreId] [uniqueidentifier] NOT NULL,
	[TotalAmount] [decimal](18, 2) NOT NULL,
	[ConfirmedById] [uniqueidentifier] NULL,
	[OrderStatus] [tinyint] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[OrderCode] [bigint] NULL,
	[PickupCode] [nvarchar](10) NULL,
	[ReservationExpiresAt] [datetime] NULL,
	[ExpectedPickupTime] [datetime2](7) NULL,
	[MaxPickupTime] [datetime2](7) NULL,
	[AgreedToNoRefundPolicy] [bit] NOT NULL,
 CONSTRAINT [PK_Orders] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PasswordResetTokens]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PasswordResetTokens](
	[Id] [uniqueidentifier] NOT NULL,
	[UserId] [uniqueidentifier] NOT NULL,
	[ResetToken] [nvarchar](200) NOT NULL,
	[ExpiresAt] [datetime2](7) NOT NULL,
	[UsedAt] [datetime2](7) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_PasswordResetTokens] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Payments]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Payments](
	[Id] [uniqueidentifier] NOT NULL,
	[OrderId] [uniqueidentifier] NOT NULL,
	[Amount] [decimal](18, 2) NOT NULL,
	[PaidAt] [datetime2](7) NULL,
	[PaymentMethod] [tinyint] NOT NULL,
	[Status] [tinyint] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Payments] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ProductImages]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProductImages](
	[Id] [uniqueidentifier] NOT NULL,
	[ProductId] [uniqueidentifier] NOT NULL,
	[ImageUrl] [nvarchar](500) NOT NULL,
	[ImageFlags] [tinyint] NOT NULL,
	[CloudinaryPublicId] [nvarchar](max) NULL,
 CONSTRAINT [PK_ProductImages] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Products]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Products](
	[Id] [uniqueidentifier] NOT NULL,
	[StoreId] [uniqueidentifier] NOT NULL,
	[CategoryId] [uniqueidentifier] NOT NULL,
	[Name] [nvarchar](200) NOT NULL,
	[Description] [nvarchar](1000) NULL,
	[OriginalPrice] [decimal](18, 2) NOT NULL,
	[ProductFlags] [tinyint] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Products] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ReviewImages]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ReviewImages](
	[Id] [uniqueidentifier] NOT NULL,
	[ReviewId] [uniqueidentifier] NOT NULL,
	[ImageUrl] [nvarchar](500) NOT NULL,
	[CloudinaryPublicId] [nvarchar](255) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_ReviewImages] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Reviews]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Reviews](
	[Id] [uniqueidentifier] NOT NULL,
	[OrderItemId] [uniqueidentifier] NOT NULL,
	[Rating] [tinyint] NOT NULL,
	[Comment] [nvarchar](1000) NULL,
	[ReviewFlags] [tinyint] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[StoreReply] [nvarchar](1000) NULL,
	[StoreReplyAt] [datetime2](7) NULL,
	[UpdatedAt] [datetime2](7) NULL,
 CONSTRAINT [PK_Reviews] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Roles]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Roles](
	[Id] [uniqueidentifier] NOT NULL,
	[Code] [nvarchar](50) NOT NULL,
	[Name] [nvarchar](100) NOT NULL,
 CONSTRAINT [PK_Roles] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Stores]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Stores](
	[Id] [uniqueidentifier] NOT NULL,
	[Name] [nvarchar](200) NOT NULL,
	[Description] [nvarchar](1000) NULL,
	[DetailedAddress] [nvarchar](300) NOT NULL,
	[Ward] [nvarchar](100) NOT NULL,
	[City] [nvarchar](100) NOT NULL,
	[Latitude] [decimal](9, 6) NULL,
	[Longitude] [decimal](9, 6) NULL,
	[PhoneNumber] [nvarchar](20) NULL,
	[LogoUrl] [nvarchar](500) NULL,
	[Status] [tinyint] NOT NULL,
	[StoreFlags] [tinyint] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[TrustScore] [int] NOT NULL,
	[ReviewNotes] [nvarchar](1000) NULL,
	[CoverCloudinaryId] [nvarchar](max) NULL,
	[CoverUrl] [nvarchar](max) NULL,
	[LogoCloudinaryId] [nvarchar](max) NULL,
	[StorefrontImageUrl] [nvarchar](max) NULL,
	[ReferenceLink] [nvarchar](max) NULL,
 CONSTRAINT [PK_Stores] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[StoreStaffs]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[StoreStaffs](
	[Id] [uniqueidentifier] NOT NULL,
	[StoreId] [uniqueidentifier] NOT NULL,
	[UserId] [uniqueidentifier] NOT NULL,
	[StaffRole] [tinyint] NOT NULL,
	[StaffFlags] [tinyint] NOT NULL,
	[JoinedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_StoreStaffs] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[StoreSubscriptions]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[StoreSubscriptions](
	[Id] [uniqueidentifier] NOT NULL,
	[StoreId] [uniqueidentifier] NOT NULL,
	[PlanId] [uniqueidentifier] NOT NULL,
	[StartDate] [datetime2](7) NOT NULL,
	[EndDate] [datetime2](7) NOT NULL,
	[Status] [tinyint] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[OrderCode] [bigint] NULL,
	[UserId] [uniqueidentifier] NULL,
 CONSTRAINT [PK_StoreSubscriptions] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[StoreWallets]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[StoreWallets](
	[Id] [uniqueidentifier] NOT NULL,
	[StoreId] [uniqueidentifier] NOT NULL,
	[AvailableBalance] [decimal](18, 2) NOT NULL,
	[PendingBalance] [decimal](18, 2) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SubscriptionPlans]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SubscriptionPlans](
	[Id] [uniqueidentifier] NOT NULL,
	[Name] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](500) NULL,
	[MonthlyPrice] [decimal](18, 2) NOT NULL,
	[PlanFlags] [tinyint] NOT NULL,
	[MaxActiveListings] [int] NULL,
	[HasCustomBanner] [bit] NOT NULL,
	[HasFeaturedBadge] [bit] NOT NULL,
	[PriorityLevel] [int] NOT NULL,
	[AnalyticsLevel] [int] NOT NULL,
 CONSTRAINT [PK_SubscriptionPlans] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UserRoles]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserRoles](
	[Id] [uniqueidentifier] NOT NULL,
	[UserId] [uniqueidentifier] NOT NULL,
	[RoleId] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_UserRoles] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Users]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Users](
	[Id] [uniqueidentifier] NOT NULL,
	[Email] [nvarchar](255) NOT NULL,
	[PasswordHash] [nvarchar](500) NOT NULL,
	[FullName] [nvarchar](150) NOT NULL,
	[PhoneNumber] [nvarchar](20) NULL,
	[Address] [nvarchar](300) NULL,
	[AvatarUrl] [nvarchar](500) NULL,
	[Status] [tinyint] NOT NULL,
	[UserFlags] [tinyint] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[Username] [nvarchar](50) NULL,
	[NormalizedEmail] [nvarchar](255) NULL,
	[ImgCloudinaryId] [nvarchar](max) NULL,
	[Latitude] [decimal](9, 6) NULL,
	[Longitude] [decimal](9, 6) NULL,
 CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UserSessions]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserSessions](
	[Id] [uniqueidentifier] NOT NULL,
	[UserId] [uniqueidentifier] NOT NULL,
	[RefreshTokenHash] [nvarchar](500) NOT NULL,
	[ExpiresAt] [datetime2](7) NOT NULL,
	[RevokedAt] [datetime2](7) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_UserSessions] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[WalletTransactions]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[WalletTransactions](
	[Id] [uniqueidentifier] NOT NULL,
	[StoreWalletId] [uniqueidentifier] NOT NULL,
	[Amount] [decimal](18, 2) NOT NULL,
	[Type] [tinyint] NOT NULL,
	[Status] [tinyint] NOT NULL,
	[OrderId] [uniqueidentifier] NULL,
	[ReferenceId] [uniqueidentifier] NULL,
	[Description] [nvarchar](500) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[WithdrawalRequests]    Script Date: 6/20/2026 4:42:46 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[WithdrawalRequests](
	[Id] [uniqueidentifier] NOT NULL,
	[StoreId] [uniqueidentifier] NULL,
	[Amount] [decimal](18, 2) NOT NULL,
	[Status] [tinyint] NOT NULL,
	[BankName] [nvarchar](255) NOT NULL,
	[BankAccountNumber] [nvarchar](50) NOT NULL,
	[BankAccountName] [nvarchar](255) NOT NULL,
	[AdminNote] [nvarchar](500) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[ProcessedAt] [datetime2](7) NULL,
	[UserId] [uniqueidentifier] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[CartItems] ([Id], [CartId], [ListingId], [Quantity]) VALUES (N'c1000000-0000-0000-0000-000000000001', N'ca870000-0000-0000-0000-000000000001', N'e5700000-0000-0000-0000-000000000001', 2)
INSERT [dbo].[CartItems] ([Id], [CartId], [ListingId], [Quantity]) VALUES (N'c1000000-0000-0000-0000-000000000003', N'ca870000-0000-0000-0000-000000000002', N'e5700000-0000-0000-0000-000000000004', 1)
INSERT [dbo].[CartItems] ([Id], [CartId], [ListingId], [Quantity]) VALUES (N'c1000000-0000-0000-0000-000000000004', N'ca870000-0000-0000-0000-000000000002', N'e5700000-0000-0000-0000-000000000005', 1)
INSERT [dbo].[CartItems] ([Id], [CartId], [ListingId], [Quantity]) VALUES (N'c1000000-0000-0000-0000-000000000005', N'ca870000-0000-0000-0000-000000000004', N'e5700000-0000-0000-0000-000000000006', 2)
INSERT [dbo].[CartItems] ([Id], [CartId], [ListingId], [Quantity]) VALUES (N'b88e7ec9-9154-4352-89d8-167309bb3687', N'51031082-8c6f-419e-90f5-020dcbf0c8ac', N'e5700000-0000-0000-0000-000000000002', 1)
INSERT [dbo].[CartItems] ([Id], [CartId], [ListingId], [Quantity]) VALUES (N'3d8df228-483c-48ee-aa83-6c469a62b8eb', N'b042b6eb-d5f8-437e-bb33-2e2e2816ab26', N'e5700000-0000-0000-0000-000000000017', 3)
INSERT [dbo].[CartItems] ([Id], [CartId], [ListingId], [Quantity]) VALUES (N'e40c2d6f-c6e1-4fc2-82bc-a59c11f63a4e', N'f970ff37-53ec-47bc-9e86-cd52ec7befd7', N'e5700000-0000-0000-0000-000000000014', 3)
INSERT [dbo].[CartItems] ([Id], [CartId], [ListingId], [Quantity]) VALUES (N'35273d16-a473-42c3-9224-c5414c5af483', N'b042b6eb-d5f8-437e-bb33-2e2e2816ab26', N'e5700000-0000-0000-0000-000000000004', 2)
GO
INSERT [dbo].[Carts] ([Id], [UserId]) VALUES (N'3daa3afc-5083-4ef2-a7e5-2f091fe044af', N'11000000-0000-0000-0000-000000000001')
INSERT [dbo].[Carts] ([Id], [UserId]) VALUES (N'ca870000-0000-0000-0000-000000000001', N'12000000-0000-0000-0000-000000000001')
INSERT [dbo].[Carts] ([Id], [UserId]) VALUES (N'9493880b-0e2b-4116-a4e7-92fa7bed54f6', N'13000000-0000-0000-0000-000000000001')
INSERT [dbo].[Carts] ([Id], [UserId]) VALUES (N'ca870000-0000-0000-0000-000000000002', N'12000000-0000-0000-0000-000000000002')
INSERT [dbo].[Carts] ([Id], [UserId]) VALUES (N'ca870000-0000-0000-0000-000000000003', N'12000000-0000-0000-0000-000000000003')
INSERT [dbo].[Carts] ([Id], [UserId]) VALUES (N'ca870000-0000-0000-0000-000000000004', N'12000000-0000-0000-0000-000000000004')
INSERT [dbo].[Carts] ([Id], [UserId]) VALUES (N'51031082-8c6f-419e-90f5-020dcbf0c8ac', N'74911152-5345-4c53-8160-7fbdd15436e6')
INSERT [dbo].[Carts] ([Id], [UserId]) VALUES (N'a67eeb86-f939-4c78-9fa5-259c778202ce', N'2f225ee8-8b15-46d9-99fa-ac33cc3bf9d2')
INSERT [dbo].[Carts] ([Id], [UserId]) VALUES (N'be57afcd-05ba-47d6-b2e9-30f6d19af8d6', N'b76004c8-b5f4-425a-8099-c449ea122fff')
INSERT [dbo].[Carts] ([Id], [UserId]) VALUES (N'f970ff37-53ec-47bc-9e86-cd52ec7befd7', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b')
INSERT [dbo].[Carts] ([Id], [UserId]) VALUES (N'b042b6eb-d5f8-437e-bb33-2e2e2816ab26', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1')
GO
INSERT [dbo].[Categories] ([Id], [Name], [CreatedAt], [IsDeleted]) VALUES (N'ca700000-0000-0000-0000-000000000001', N'Bánh mì & Bánh ngọt', CAST(N'2026-05-25T16:09:17.1274508' AS DateTime2), 0)
INSERT [dbo].[Categories] ([Id], [Name], [CreatedAt], [IsDeleted]) VALUES (N'ca700000-0000-0000-0000-000000000002', N'Cơm & Món mặn', CAST(N'2026-05-25T16:09:17.1274508' AS DateTime2), 1)
INSERT [dbo].[Categories] ([Id], [Name], [CreatedAt], [IsDeleted]) VALUES (N'ca700000-0000-0000-0000-000000000003', N'Sushi & Đồ Nhật', CAST(N'2026-05-25T16:09:17.1274508' AS DateTime2), 0)
INSERT [dbo].[Categories] ([Id], [Name], [CreatedAt], [IsDeleted]) VALUES (N'ca700000-0000-0000-0000-000000000004', N'Cà phê & Đồ uống', CAST(N'2026-05-25T16:09:17.1274508' AS DateTime2), 0)
INSERT [dbo].[Categories] ([Id], [Name], [CreatedAt], [IsDeleted]) VALUES (N'ca700000-0000-0000-0000-000000000005', N'Kem & Tráng miệng', CAST(N'2026-05-25T16:09:17.1274508' AS DateTime2), 0)
INSERT [dbo].[Categories] ([Id], [Name], [CreatedAt], [IsDeleted]) VALUES (N'ca700000-0000-0000-0000-000000000006', N'Salad & Đồ ăn healthy', CAST(N'2026-05-25T16:09:17.1274508' AS DateTime2), 0)
INSERT [dbo].[Categories] ([Id], [Name], [CreatedAt], [IsDeleted]) VALUES (N'ca700000-0000-0000-0000-000000000007', N'Sandwich & Wrap', CAST(N'2026-05-25T16:09:17.1274508' AS DateTime2), 0)
INSERT [dbo].[Categories] ([Id], [Name], [CreatedAt], [IsDeleted]) VALUES (N'ca700000-0000-0000-0000-000000000008', N'Thực phẩm đóng gói', CAST(N'2026-05-25T16:09:17.1274508' AS DateTime2), 0)
GO
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000001', N'f00d0000-0000-0000-0000-000000000001', N'Morning Bake - Bánh Mì Thịt Nguội Signature', CAST(18000.00 AS Decimal(18, 2)), 4, CAST(N'2026-07-14T17:54:07.7438590' AS DateTime2), 1, 0, CAST(N'2026-05-25T16:09:17.1463620' AS DateTime2))
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000002', N'f00d0000-0000-0000-0000-000000000003', N'Morning Bake - Croissant Bơ Pháp Handmade', CAST(22000.00 AS Decimal(18, 2)), 5, CAST(N'2026-06-29T17:54:07.7443820' AS DateTime2), 1, 2, CAST(N'2026-05-25T16:09:17.1463620' AS DateTime2))
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000003', N'f00d0000-0000-0000-0000-000000000005', N'The Daily Coffee - Tiramisu Classic Cup', CAST(30000.00 AS Decimal(18, 2)), 10, CAST(N'2026-07-29T17:54:07.7446126' AS DateTime2), 0, 0, CAST(N'2026-05-25T16:09:17.1463620' AS DateTime2))
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000004', N'f00d0000-0000-0000-0000-000000000006', N'The Daily Coffee - Sandwich Gà Nướng Caesar', CAST(40000.00 AS Decimal(18, 2)), 12, CAST(N'2026-06-29T17:54:07.7446126' AS DateTime2), 1, 0, CAST(N'2026-05-25T16:09:17.1463620' AS DateTime2))
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000005', N'f00d0000-0000-0000-0000-000000000007', N'Sushi Go - Combo Sushi Mix 10 Miếng', CAST(90000.00 AS Decimal(18, 2)), 5, CAST(N'2026-07-14T17:54:07.7446126' AS DateTime2), 1, 0, CAST(N'2026-05-25T16:09:17.1463620' AS DateTime2))
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000006', N'f00d0000-0000-0000-0000-000000000008', N'Sushi Go - Sashimi Cá Hồi Na Uy', CAST(90000.00 AS Decimal(18, 2)), 4, CAST(N'2026-06-29T17:54:07.7456552' AS DateTime2), 1, 0, CAST(N'2026-05-25T16:09:17.1463620' AS DateTime2))
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000007', N'f00d0000-0000-0000-0000-000000000004', N'The Daily Coffee - Cold Brew Ethiopia', CAST(35000.00 AS Decimal(18, 2)), 20, CAST(N'2026-07-29T17:54:07.7461593' AS DateTime2), 0, 0, CAST(N'2026-05-25T16:09:17.1463620' AS DateTime2))
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000008', N'f00d0000-0000-0000-0000-000000000002', N'Morning Bake - Bánh Mì Trứng Phô Mai', CAST(12000.00 AS Decimal(18, 2)), 0, CAST(N'2026-06-14T17:54:07.7461593' AS DateTime2), 3, 0, CAST(N'2026-05-25T16:09:17.1463620' AS DateTime2))
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000009', N'f00d0000-0000-0000-0000-000000000009', N'Sushi Go - Salad Rong Biển Nhật Bản', CAST(35000.00 AS Decimal(18, 2)), 3, CAST(N'2026-06-19T17:54:07.7461593' AS DateTime2), 3, 0, CAST(N'2026-05-25T16:09:17.1463620' AS DateTime2))
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000010', N'f00d0000-0000-0000-0000-000000000010', N'Triều Patisserie - Croissant Bơ Pháp', CAST(29000.00 AS Decimal(18, 2)), 20, CAST(N'2026-07-14T17:54:07.7699096' AS DateTime2), 0, 0, CAST(N'2026-05-30T17:54:07.7699096' AS DateTime2))
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000011', N'f00d0000-0000-0000-0000-000000000011', N'Triều Patisserie - Surprise Pastry Box', CAST(59000.00 AS Decimal(18, 2)), 12, CAST(N'2026-06-29T17:54:07.7699096' AS DateTime2), 0, 0, CAST(N'2026-05-30T17:54:07.7699096' AS DateTime2))
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000012', N'f00d0000-0000-0000-0000-000000000012', N'Nyahaha - Combo Muffin Chocolate', CAST(39000.00 AS Decimal(18, 2)), 15, CAST(N'2026-07-29T17:54:07.7699096' AS DateTime2), 1, 0, CAST(N'2026-05-30T17:54:07.7699096' AS DateTime2))
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000013', N'f00d0000-0000-0000-0000-000000000013', N'Nyahaha - Croissant & Danish Box', CAST(49000.00 AS Decimal(18, 2)), 9, CAST(N'2026-07-14T17:54:07.7699096' AS DateTime2), 1, 2, CAST(N'2026-05-30T17:54:07.7699096' AS DateTime2))
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000014', N'f00d0000-0000-0000-0000-000000000014', N'Salads Hub - Healthy Chicken Bowl', CAST(59000.00 AS Decimal(18, 2)), 10, CAST(N'2026-06-29T17:54:07.7699096' AS DateTime2), 1, 0, CAST(N'2026-05-30T17:54:07.7699096' AS DateTime2))
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000015', N'f00d0000-0000-0000-0000-000000000015', N'Salads Hub - Salad Cá Ngừ', CAST(49000.00 AS Decimal(18, 2)), 8, CAST(N'2026-07-29T17:54:07.7699096' AS DateTime2), 0, 0, CAST(N'2026-05-30T17:54:07.7699096' AS DateTime2))
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000016', N'f00d0000-0000-0000-0000-000000000016', N'SushiLAB - Sushi Mix Box', CAST(89000.00 AS Decimal(18, 2)), 8, CAST(N'2026-07-14T17:54:07.7699096' AS DateTime2), 1, 0, CAST(N'2026-05-30T17:54:07.7699096' AS DateTime2))
INSERT [dbo].[ClearanceListings] ([Id], [ProductId], [Title], [SalePrice], [QuantityAvailable], [ExpiryDate], [Status], [ListingFlags], [CreatedAt]) VALUES (N'e5700000-0000-0000-0000-000000000017', N'f00d0000-0000-0000-0000-000000000017', N'SushiLAB - Salmon Nigiri Set', CAST(109000.00 AS Decimal(18, 2)), 6, CAST(N'2026-06-29T17:54:07.7699096' AS DateTime2), 1, 0, CAST(N'2026-05-30T17:54:07.7699096' AS DateTime2))
GO
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'4d759e8e-1233-4b8f-90d6-029662915c8a', N'14000000-0000-0000-0000-000000000002', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'2d0d10ad-cbc6-4a8f-84b7-0cd5359628e7', N'13000000-0000-0000-0000-000000000003', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'1e5e7e64-85fa-433e-b068-17d7474ef0fd', N'7aa19d55-e47b-4dc8-85d3-0c900fa43b6e', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'a40a9437-ecf2-4406-9288-341d408e503e', N'13000000-0000-0000-0000-000000000001', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'cd6107af-af53-4538-9fcc-3600eec7e4db', N'118407c3-5466-42c2-8fb9-483cfb438cd0', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'd59e476a-bdb1-4cb4-92a5-364ad8771f58', N'12000000-0000-0000-0000-000000000003', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'255e9b23-7511-4466-b37c-39b060097e42', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'ad09cd9e-4bcc-4a02-909d-3bc9fd6755a8', N'74911152-5345-4c53-8160-7fbdd15436e6', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'191e490f-2821-4306-b18b-4233d1e52a12', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', CAST(9964000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:35:03.3158099' AS DateTime2), CAST(N'2026-06-19T17:49:23.1664153' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'8459f4cd-f628-4adb-b635-55ed5ed977cb', N'09d0d8af-00e3-47da-93fc-2beac9ac4c33', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'40aef147-824a-4b16-9ce4-5daba60953ea', N'11000000-0000-0000-0000-000000000001', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'b3ead9b1-182a-4aea-a72f-7dd1d2d19232', N'12000000-0000-0000-0000-000000000004', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'48c9ae2d-b4b8-4350-91a2-9965c48bd7fb', N'14000000-0000-0000-0000-000000000001', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'd076adb9-c10d-4448-b64d-9c3b85ac9591', N'12000000-0000-0000-0000-000000000002', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'686ab991-2eb2-4373-b986-a7f42b0da855', N'12000000-0000-0000-0000-000000000001', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'5c63ebdd-510c-46bf-9317-b85c3deaa124', N'13000000-0000-0000-0000-000000000002', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'1c6425e4-e898-40b9-8d23-c9375ed1ecfa', N'2f225ee8-8b15-46d9-99fa-ac33cc3bf9d2', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
INSERT [dbo].[CustomerWallets] ([Id], [UserId], [Balance], [CreatedAt], [UpdatedAt]) VALUES (N'ff7f4861-1552-4168-af15-d9703061faa7', N'b76004c8-b5f4-425a-8099-c449ea122fff', CAST(10000000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2), CAST(N'2026-06-19T17:36:33.7200000' AS DateTime2))
GO
INSERT [dbo].[CustomerWalletTransactions] ([Id], [CustomerWalletId], [Amount], [Type], [Status], [OrderId], [Description], [CreatedAt], [ReferenceId]) VALUES (N'e9145782-1303-47bc-b004-5db37f22734c', N'191e490f-2821-4306-b18b-4233d1e52a12', CAST(90000.00 AS Decimal(18, 2)), 2, 1, N'720983e8-765c-45e0-a8d5-f4889523456c', N'Thanh toán đơn hàng DH 1781890727017', CAST(N'2026-06-19T17:38:47.4152154' AS DateTime2), NULL)
INSERT [dbo].[CustomerWalletTransactions] ([Id], [CustomerWalletId], [Amount], [Type], [Status], [OrderId], [Description], [CreatedAt], [ReferenceId]) VALUES (N'2dfa577b-3cd1-45e7-8f91-682c2f9b271b', N'191e490f-2821-4306-b18b-4233d1e52a12', CAST(90000.00 AS Decimal(18, 2)), 0, 1, N'720983e8-765c-45e0-a8d5-f4889523456c', N'Hoàn tiền tự động cho đơn hàng hết hạn 1781890727017', CAST(N'2026-06-19T17:49:23.1684168' AS DateTime2), NULL)
INSERT [dbo].[CustomerWalletTransactions] ([Id], [CustomerWalletId], [Amount], [Type], [Status], [OrderId], [Description], [CreatedAt], [ReferenceId]) VALUES (N'b77f4d9a-07e8-42bc-9eba-a5c3aab1e07a', N'191e490f-2821-4306-b18b-4233d1e52a12', CAST(36000.00 AS Decimal(18, 2)), 2, 1, N'78d917d3-cfe1-497c-aeb0-782e333a29d1', N'Thanh toán đơn hàng DH 1781890727017', CAST(N'2026-06-19T17:38:47.4152154' AS DateTime2), NULL)
GO
INSERT [dbo].[EmailVerifications] ([Id], [UserId], [VerificationCode], [ExpiresAt], [VerifiedAt], [CreatedAt]) VALUES (N'd1000000-0000-0000-0000-000000000001', N'12000000-0000-0000-0000-000000000001', N'482917', CAST(N'2026-05-16T16:09:17.1022661' AS DateTime2), CAST(N'2026-05-15T16:09:17.1022661' AS DateTime2), CAST(N'2026-05-25T16:09:17.1022661' AS DateTime2))
INSERT [dbo].[EmailVerifications] ([Id], [UserId], [VerificationCode], [ExpiresAt], [VerifiedAt], [CreatedAt]) VALUES (N'd1000000-0000-0000-0000-000000000002', N'12000000-0000-0000-0000-000000000003', N'739025', CAST(N'2026-05-26T16:09:17.1022661' AS DateTime2), NULL, CAST(N'2026-05-25T16:09:17.1022661' AS DateTime2))
INSERT [dbo].[EmailVerifications] ([Id], [UserId], [VerificationCode], [ExpiresAt], [VerifiedAt], [CreatedAt]) VALUES (N'c63409f9-968b-49a8-a305-0bd199ab4fff', N'7aa19d55-e47b-4dc8-85d3-0c900fa43b6e', N'117345', CAST(N'2026-06-17T15:49:50.4161703' AS DateTime2), NULL, CAST(N'2026-06-17T15:34:50.4161701' AS DateTime2))
INSERT [dbo].[EmailVerifications] ([Id], [UserId], [VerificationCode], [ExpiresAt], [VerifiedAt], [CreatedAt]) VALUES (N'4ae8f838-144f-4d9c-a0b1-1b9900923295', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'674597', CAST(N'2026-06-17T15:31:35.5745165' AS DateTime2), CAST(N'2026-06-17T15:17:52.3331507' AS DateTime2), CAST(N'2026-06-17T15:16:35.5745001' AS DateTime2))
INSERT [dbo].[EmailVerifications] ([Id], [UserId], [VerificationCode], [ExpiresAt], [VerifiedAt], [CreatedAt]) VALUES (N'b4b31d08-a61f-4d41-b671-34909bd3f2fa', N'118407c3-5466-42c2-8fb9-483cfb438cd0', N'316540', CAST(N'2026-06-17T15:54:58.8691451' AS DateTime2), NULL, CAST(N'2026-06-17T15:39:58.8691448' AS DateTime2))
INSERT [dbo].[EmailVerifications] ([Id], [UserId], [VerificationCode], [ExpiresAt], [VerifiedAt], [CreatedAt]) VALUES (N'6e1f4bcc-98af-4cfa-93a6-e6b3bee68a2e', N'b76004c8-b5f4-425a-8099-c449ea122fff', N'702938', CAST(N'2026-05-27T10:31:07.0089419' AS DateTime2), CAST(N'2026-05-27T10:17:28.9729885' AS DateTime2), CAST(N'2026-05-27T10:16:07.0088811' AS DateTime2))
GO
INSERT [dbo].[ListingDiscountRules] ([Id], [ListingId], [RuleOrder], [DiscountPercent], [TargetPrice], [TriggerValue], [TriggerType], [RuleFlags], [CreatedAt]) VALUES (N'd8000000-0001-0000-0000-000000000001', N'e5700000-0000-0000-0000-000000000002', 1, CAST(20.00 AS Decimal(5, 2)), NULL, 60, 0, 1, CAST(N'2026-05-25T16:09:17.1540939' AS DateTime2))
INSERT [dbo].[ListingDiscountRules] ([Id], [ListingId], [RuleOrder], [DiscountPercent], [TargetPrice], [TriggerValue], [TriggerType], [RuleFlags], [CreatedAt]) VALUES (N'd8000000-0005-0000-0000-000000000001', N'e5700000-0000-0000-0000-000000000005', 1, NULL, CAST(60000.00 AS Decimal(18, 2)), 2, 1, 1, CAST(N'2026-05-25T16:09:17.1540939' AS DateTime2))
INSERT [dbo].[ListingDiscountRules] ([Id], [ListingId], [RuleOrder], [DiscountPercent], [TargetPrice], [TriggerValue], [TriggerType], [RuleFlags], [CreatedAt]) VALUES (N'd8000000-0006-0000-0000-000000000001', N'e5700000-0000-0000-0000-000000000006', 1, CAST(10.00 AS Decimal(5, 2)), NULL, 90, 0, 1, CAST(N'2026-05-25T16:09:17.1540939' AS DateTime2))
INSERT [dbo].[ListingDiscountRules] ([Id], [ListingId], [RuleOrder], [DiscountPercent], [TargetPrice], [TriggerValue], [TriggerType], [RuleFlags], [CreatedAt]) VALUES (N'd8000000-0006-0000-0000-000000000002', N'e5700000-0000-0000-0000-000000000006', 2, NULL, CAST(50000.00 AS Decimal(18, 2)), 1, 1, 1, CAST(N'2026-05-25T16:09:17.1540939' AS DateTime2))
GO
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'fffc9a67-b56b-4ced-9782-249ee1851c71', N'e5700000-0000-0000-0000-000000000001', N'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'6b475369-d1c8-43c1-ad26-496a74e0b17f', N'e5700000-0000-0000-0000-000000000016', N'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'11d4d846-0ad3-4910-8554-4b1758b1ef41', N'e5700000-0000-0000-0000-000000000017', N'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'699fec9f-05c3-4674-a1b7-5017a08e6e2b', N'e5700000-0000-0000-0000-000000000011', N'https://images.unsplash.com/photo-1509365465994-3e89cd3b84db?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'6419b53b-c40a-4171-8215-526f97543699', N'e5700000-0000-0000-0000-000000000012', N'https://images.unsplash.com/photo-1603532648955-039310d9ed75?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'e71a7699-3760-4b6b-bdbb-537569289c2a', N'e5700000-0000-0000-0000-000000000009', N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'6a51f3a0-c6f5-43d3-ab10-55c191b02bcd', N'e5700000-0000-0000-0000-000000000010', N'https://images.unsplash.com/photo-1530610476181-d83430b64dcb?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'd8564f9b-5b0b-4090-b160-71e21a3379ce', N'e5700000-0000-0000-0000-000000000005', N'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'e18980e2-a84d-4e3c-918c-7aa92d46cf2e', N'e5700000-0000-0000-0000-000000000001', N'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'98182632-065e-4411-976f-a81e36557446', N'e5700000-0000-0000-0000-000000000013', N'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'31710428-c364-46de-84ee-b1cd52f7c99f', N'e5700000-0000-0000-0000-000000000004', N'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'40a9f84b-8433-4c68-be28-c7a8505bd879', N'e5700000-0000-0000-0000-000000000001', N'https://images.unsplash.com/photo-1549590143-d5855148a9d5?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'084bd1aa-dedc-48cb-a447-ce27aa6145c0', N'e5700000-0000-0000-0000-000000000006', N'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'cdea927a-c784-4e19-8728-cf2a6148f465', N'e5700000-0000-0000-0000-000000000008', N'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'f823b202-4de8-4d24-9a7b-e4b5b2254d25', N'e5700000-0000-0000-0000-000000000014', N'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'55753b3c-1925-48f7-97ed-e946a009afa6', N'e5700000-0000-0000-0000-000000000002', N'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ListingImages] ([Id], [ListingId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'6a215b80-bbf3-4b57-8a6c-ee470ed9a7e6', N'e5700000-0000-0000-0000-000000000015', N'https://images.unsplash.com/photo-1540420773420-336677a637d7?auto=format&fit=crop&w=800&q=80', 1, NULL)
GO
INSERT [dbo].[OrderItems] ([Id], [OrderId], [ListingId], [ProductNameSnapshot], [UnitPriceSnapshot], [Quantity]) VALUES (N'17c053da-6490-4f4b-865d-7ab517842fbd', N'720983e8-765c-45e0-a8d5-f4889523456c', N'e5700000-0000-0000-0000-000000000006', N'Sushi Go - Sashimi Cá Hồi Na Uy', CAST(90000.00 AS Decimal(18, 2)), 1)
INSERT [dbo].[OrderItems] ([Id], [OrderId], [ListingId], [ProductNameSnapshot], [UnitPriceSnapshot], [Quantity]) VALUES (N'21fd9e32-274f-4508-aebf-e215d9602476', N'78d917d3-cfe1-497c-aeb0-782e333a29d1', N'e5700000-0000-0000-0000-000000000001', N'Morning Bake - Bánh Mì Thịt Nguội Signature', CAST(18000.00 AS Decimal(18, 2)), 2)
GO
INSERT [dbo].[Orders] ([Id], [UserId], [StoreId], [TotalAmount], [ConfirmedById], [OrderStatus], [CreatedAt], [OrderCode], [PickupCode], [ReservationExpiresAt], [ExpectedPickupTime], [MaxPickupTime], [AgreedToNoRefundPolicy]) VALUES (N'78d917d3-cfe1-497c-aeb0-782e333a29d1', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'21000000-0000-0000-0000-000000000001', CAST(36000.00 AS Decimal(18, 2)), N'13000000-0000-0000-0000-000000000001', 3, CAST(N'2026-06-19T17:38:47.2882646' AS DateTime2), 1781890727017, N'SBHCE9', CAST(N'2026-06-19T17:48:47.137' AS DateTime), CAST(N'2026-06-19T18:30:00.0000000' AS DateTime2), CAST(N'2026-06-20T16:59:59.0000000' AS DateTime2), 1)
INSERT [dbo].[Orders] ([Id], [UserId], [StoreId], [TotalAmount], [ConfirmedById], [OrderStatus], [CreatedAt], [OrderCode], [PickupCode], [ReservationExpiresAt], [ExpectedPickupTime], [MaxPickupTime], [AgreedToNoRefundPolicy]) VALUES (N'720983e8-765c-45e0-a8d5-f4889523456c', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'21000000-0000-0000-0000-000000000003', CAST(90000.00 AS Decimal(18, 2)), NULL, 4, CAST(N'2026-06-19T17:38:47.2882646' AS DateTime2), 1781890727017, N'VTC7GM', NULL, CAST(N'2026-06-19T18:30:00.0000000' AS DateTime2), CAST(N'2026-06-20T16:59:59.0000000' AS DateTime2), 1)
GO
INSERT [dbo].[PasswordResetTokens] ([Id], [UserId], [ResetToken], [ExpiresAt], [UsedAt], [CreatedAt]) VALUES (N'e1000000-0000-0000-0000-000000000001', N'12000000-0000-0000-0000-000000000002', N'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.USED_TOKEN', CAST(N'2026-05-20T17:09:17.1066810' AS DateTime2), CAST(N'2026-05-20T16:09:17.1066810' AS DateTime2), CAST(N'2026-05-25T16:09:17.1066810' AS DateTime2))
INSERT [dbo].[PasswordResetTokens] ([Id], [UserId], [ResetToken], [ExpiresAt], [UsedAt], [CreatedAt]) VALUES (N'e1000000-0000-0000-0000-000000000002', N'12000000-0000-0000-0000-000000000004', N'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ACTIVE_TOKEN', CAST(N'2026-05-25T17:09:17.1066810' AS DateTime2), NULL, CAST(N'2026-05-25T16:09:17.1066810' AS DateTime2))
GO
INSERT [dbo].[Payments] ([Id], [OrderId], [Amount], [PaidAt], [PaymentMethod], [Status], [CreatedAt]) VALUES (N'0eb21581-1e13-4a8f-b42f-0d74c4206566', N'78d917d3-cfe1-497c-aeb0-782e333a29d1', CAST(36000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:38:47.3726362' AS DateTime2), 0, 1, CAST(N'2026-06-19T17:38:47.2904220' AS DateTime2))
INSERT [dbo].[Payments] ([Id], [OrderId], [Amount], [PaidAt], [PaymentMethod], [Status], [CreatedAt]) VALUES (N'537a16f3-b0ee-47a5-a471-120e22e3b8f4', N'720983e8-765c-45e0-a8d5-f4889523456c', CAST(90000.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:38:47.3688022' AS DateTime2), 0, 1, CAST(N'2026-06-19T17:38:47.2904220' AS DateTime2))
GO
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'c4cb1e59-3c85-4d7c-9ea3-007853879a43', N'f00d0000-0000-0000-0000-000000000003', N'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'cefc8b45-77a6-4b35-aeed-015dff71241e', N'f00d0000-0000-0000-0000-000000000012', N'https://images.unsplash.com/photo-1603532648955-039310d9ed75?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'92507248-1695-4974-a54d-0949476c6a3e', N'f00d0000-0000-0000-0000-000000000014', N'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'2e1b40a8-0082-4f6b-a050-2997aa3f8b0c', N'f00d0000-0000-0000-0000-000000000017', N'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'97723158-6d81-4068-9a4c-4354d30c7019', N'f00d0000-0000-0000-0000-000000000007', N'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'894a9865-a974-4ab1-870b-4f18fab8d342', N'f00d0000-0000-0000-0000-000000000004', N'https://images.unsplash.com/photo-1461023058943-0708e522384c?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'1e824534-ba52-4b04-8950-4fb53fd8904c', N'f00d0000-0000-0000-0000-000000000013', N'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'055f8452-b2ee-4b7c-a995-5070e1e83ba9', N'f00d0000-0000-0000-0000-000000000010', N'https://images.unsplash.com/photo-1530610476181-d83430b64dcb?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'71876461-d03e-4767-9f3d-507a60172170', N'f00d0000-0000-0000-0000-000000000016', N'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'8c444596-57e5-4343-bcac-601d79dc69e6', N'f00d0000-0000-0000-0000-000000000009', N'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'3aa5c574-b0b3-4ab6-8f4e-74ca776fca54', N'f00d0000-0000-0000-0000-000000000001', N'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'95fc0677-0184-4307-9814-965b7a5598c8', N'f00d0000-0000-0000-0000-000000000001', N'https://images.unsplash.com/photo-1549590143-d5855148a9d5?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'117c28d3-cb25-49ef-a85c-a55f7e1d14dd', N'f00d0000-0000-0000-0000-000000000005', N'https://images.unsplash.com/photo-1571115177098-24edf68bba10?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'ae7314a3-c200-4aa8-9af3-a5c89095742e', N'f00d0000-0000-0000-0000-000000000002', N'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'bf57108b-a311-4345-9588-b1e05a10d56c', N'f00d0000-0000-0000-0000-000000000001', N'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'10baa691-5126-48a1-ac25-b2d611660016', N'f00d0000-0000-0000-0000-000000000006', N'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'62434324-c1b6-4bba-a685-b87d87576eab', N'f00d0000-0000-0000-0000-000000000008', N'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'22b5e8cd-9749-48d6-89b3-b88483a0111a', N'f00d0000-0000-0000-0000-000000000011', N'https://images.unsplash.com/photo-1509365465994-3e89cd3b84db?auto=format&fit=crop&w=800&q=80', 1, NULL)
INSERT [dbo].[ProductImages] ([Id], [ProductId], [ImageUrl], [ImageFlags], [CloudinaryPublicId]) VALUES (N'343a7be7-d525-404d-8ac5-fcdf2e27c615', N'f00d0000-0000-0000-0000-000000000015', N'https://images.unsplash.com/photo-1540420773420-336677a637d7?auto=format&fit=crop&w=800&q=80', 1, NULL)
GO
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000001', N'21000000-0000-0000-0000-000000000001', N'ca700000-0000-0000-0000-000000000001', N'Bánh Mì Thịt Nguội Signature', N'Bánh mì thịt nguội làm trong ngày, thường được đưa lên SaveFood sau 20h.', CAST(35000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-25T16:09:17.1343742' AS DateTime2))
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000002', N'21000000-0000-0000-0000-000000000001', N'ca700000-0000-0000-0000-000000000001', N'Bánh Mì Trứng Phô Mai', N'Bánh mì nóng giòn cùng trứng và phô mai tan chảy.', CAST(25000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-25T16:09:17.1343742' AS DateTime2))
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000003', N'21000000-0000-0000-0000-000000000001', N'ca700000-0000-0000-0000-000000000001', N'Croissant Bơ Pháp Handmade', N'Croissant nướng mỗi sáng bằng bơ Pháp.', CAST(45000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-25T16:09:17.1343742' AS DateTime2))
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000004', N'21000000-0000-0000-0000-000000000002', N'ca700000-0000-0000-0000-000000000004', N'Cold Brew Ethiopia', N'Cold Brew hạt Ethiopia ủ lạnh 18 giờ.', CAST(65000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-25T16:09:17.1343742' AS DateTime2))
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000005', N'21000000-0000-0000-0000-000000000002', N'ca700000-0000-0000-0000-000000000001', N'Tiramisu Classic Cup', N'Tiramisu làm mới trong ngày.', CAST(55000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-25T16:09:17.1343742' AS DateTime2))
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000006', N'21000000-0000-0000-0000-000000000002', N'ca700000-0000-0000-0000-000000000007', N'Sandwich Gà Nướng Caesar', N'Sandwich gà nướng và sốt Caesar.', CAST(75000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-25T16:09:17.1343742' AS DateTime2))
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000007', N'21000000-0000-0000-0000-000000000003', N'ca700000-0000-0000-0000-000000000003', N'Combo Sushi Mix 10 Miếng', N'Combo sushi tổng hợp cá hồi, cá ngừ và tôm.', CAST(180000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-25T16:09:17.1343742' AS DateTime2))
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000008', N'21000000-0000-0000-0000-000000000003', N'ca700000-0000-0000-0000-000000000003', N'Sashimi Cá Hồi Na Uy', N'Sashimi cá hồi tươi cắt lát.', CAST(150000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-25T16:09:17.1343742' AS DateTime2))
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000009', N'21000000-0000-0000-0000-000000000003', N'ca700000-0000-0000-0000-000000000006', N'Salad Rong Biển Nhật Bản', N'Salad rong biển với sốt mè rang kiểu Nhật.', CAST(65000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-25T16:09:17.1343742' AS DateTime2))
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000010', N'21000000-0000-0000-0000-000000000005', N'ca700000-0000-0000-0000-000000000001', N'Croissant Bơ Pháp', N'Croissant thủ công nướng mỗi sáng.', CAST(45000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-30T17:54:07.7397459' AS DateTime2))
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000011', N'21000000-0000-0000-0000-000000000005', N'ca700000-0000-0000-0000-000000000001', N'Hộp Pastry Cuối Ngày', N'Tổng hợp bánh ngọt còn lại trong ngày.', CAST(89000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-30T17:54:07.7397459' AS DateTime2))
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000012', N'21000000-0000-0000-0000-000000000006', N'ca700000-0000-0000-0000-000000000001', N'Combo Muffin Chocolate', N'Muffin chocolate handmade.', CAST(69000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-30T17:54:07.7422520' AS DateTime2))
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000013', N'21000000-0000-0000-0000-000000000006', N'ca700000-0000-0000-0000-000000000001', N'Combo Croissant & Danish', N'Combo bánh ngọt cuối ngày.', CAST(79000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-30T17:54:07.7422520' AS DateTime2))
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000014', N'21000000-0000-0000-0000-000000000007', N'ca700000-0000-0000-0000-000000000006', N'Healthy Chicken Bowl', N'Ức gà áp chảo cùng rau củ.', CAST(99000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-30T17:54:07.7427686' AS DateTime2))
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000015', N'21000000-0000-0000-0000-000000000007', N'ca700000-0000-0000-0000-000000000006', N'Salad Cá Ngừ', N'Salad cá ngừ tươi với sốt mè rang.', CAST(85000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-30T17:54:07.7427686' AS DateTime2))
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000016', N'21000000-0000-0000-0000-000000000008', N'ca700000-0000-0000-0000-000000000003', N'Sushi Mix Box', N'Hộp sushi tổng hợp.', CAST(159000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-30T17:54:07.7432827' AS DateTime2))
INSERT [dbo].[Products] ([Id], [StoreId], [CategoryId], [Name], [Description], [OriginalPrice], [ProductFlags], [CreatedAt]) VALUES (N'f00d0000-0000-0000-0000-000000000017', N'21000000-0000-0000-0000-000000000008', N'ca700000-0000-0000-0000-000000000003', N'Salmon Nigiri Set', N'Nigiri cá hồi tươi.', CAST(189000.00 AS Decimal(18, 2)), 0, CAST(N'2026-05-30T17:54:07.7432827' AS DateTime2))
GO
INSERT [dbo].[ReviewImages] ([Id], [ReviewId], [ImageUrl], [CloudinaryPublicId], [CreatedAt]) VALUES (N'5d085c1d-39b3-4c90-a430-15b861cee8c6', N'4e413a67-2099-4576-a15a-670bd86f9f1b', N'https://res.cloudinary.com/dpbaa45ft/image/upload/v1781890946/xx5glgf0arnnwax6mddv.jpg', N'xx5glgf0arnnwax6mddv', CAST(N'2026-06-19T17:42:27.1416322' AS DateTime2))
INSERT [dbo].[ReviewImages] ([Id], [ReviewId], [ImageUrl], [CloudinaryPublicId], [CreatedAt]) VALUES (N'6a45332b-c139-4e53-bcea-be4059c73bd7', N'4e413a67-2099-4576-a15a-670bd86f9f1b', N'https://res.cloudinary.com/dpbaa45ft/image/upload/v1781890967/anwov2gpxod2mzni7elq.jpg', N'anwov2gpxod2mzni7elq', CAST(N'2026-06-19T17:42:48.9930958' AS DateTime2))
GO
INSERT [dbo].[Reviews] ([Id], [OrderItemId], [Rating], [Comment], [ReviewFlags], [CreatedAt], [StoreReply], [StoreReplyAt], [UpdatedAt]) VALUES (N'4e413a67-2099-4576-a15a-670bd86f9f1b', N'21fd9e32-274f-4508-aebf-e215d9602476', 4, N'oko oko', 0, CAST(N'2026-06-19T17:42:19.9915924' AS DateTime2), NULL, NULL, NULL)
GO
INSERT [dbo].[Roles] ([Id], [Code], [Name]) VALUES (N'a1000000-0000-0000-0000-000000000001', N'ADMIN', N'Quản trị viên hệ thống')
INSERT [dbo].[Roles] ([Id], [Code], [Name]) VALUES (N'a1000000-0000-0000-0000-000000000002', N'CUSTOMER', N'Khách hàng')
INSERT [dbo].[Roles] ([Id], [Code], [Name]) VALUES (N'a1000000-0000-0000-0000-000000000003', N'STORE', N'Cửa hàng')
GO
INSERT [dbo].[Stores] ([Id], [Name], [Description], [DetailedAddress], [Ward], [City], [Latitude], [Longitude], [PhoneNumber], [LogoUrl], [Status], [StoreFlags], [CreatedAt], [TrustScore], [ReviewNotes], [CoverCloudinaryId], [CoverUrl], [LogoCloudinaryId], [StorefrontImageUrl], [ReferenceLink]) VALUES (N'21000000-0000-0000-0000-000000000001', N'Tiệm bánh Triều Patisserie', N'Bakery và pastry cao cấp. Các hộp bánh SaveFood được mở bán vào cuối ngày.', N'23 P. Hàng Nón, Phường Hoàn Kiếm', N'Hoàn Kiếm', N'Hà Nội', CAST(21.032346 AS Decimal(9, 6)), CAST(105.847873 AS Decimal(9, 6)), N'0906053366', N'https://ui-avatars.com/api/?name=Tiệm+bánh+Triều+Patisserie&background=random', 0, 2, CAST(N'2026-05-25T16:09:17.1117090' AS DateTime2), 100, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Stores] ([Id], [Name], [Description], [DetailedAddress], [Ward], [City], [Latitude], [Longitude], [PhoneNumber], [LogoUrl], [Status], [StoreFlags], [CreatedAt], [TrustScore], [ReviewNotes], [CoverCloudinaryId], [CoverUrl], [LogoCloudinaryId], [StorefrontImageUrl], [ReferenceLink]) VALUES (N'21000000-0000-0000-0000-000000000002', N'Nyahaha Cake & Coffee', N'Cà phê và bánh ngọt handmade.', N'6A P. Nhà Hỏa, Phường Hoàn Kiếm', N'Hoàn Kiếm', N'Hà Nội', CAST(21.045610 AS Decimal(9, 6)), CAST(105.839846 AS Decimal(9, 6)), N'0979834250', N'https://ui-avatars.com/api/?name=Nyahaha+Cake+and+Coffee&background=random', 0, 2, CAST(N'2026-05-25T16:09:17.1117090' AS DateTime2), 100, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Stores] ([Id], [Name], [Description], [DetailedAddress], [Ward], [City], [Latitude], [Longitude], [PhoneNumber], [LogoUrl], [Status], [StoreFlags], [CreatedAt], [TrustScore], [ReviewNotes], [CoverCloudinaryId], [CoverUrl], [LogoCloudinaryId], [StorefrontImageUrl], [ReferenceLink]) VALUES (N'21000000-0000-0000-0000-000000000003', N'Salads Hub', N'Salad tươi, healthy bowl và nước ép.', N'95G P. Lý Nam Đế, Phường Hoàn Kiếm', N'Hoàn Kiếm', N'Hà Nội', CAST(10.783688 AS Decimal(9, 6)), CAST(106.691763 AS Decimal(9, 6)), N'0829292727', N'https://ui-avatars.com/api/?name=Salads+Hub&background=random', 0, 2, CAST(N'2026-05-25T16:09:17.1117090' AS DateTime2), 100, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Stores] ([Id], [Name], [Description], [DetailedAddress], [Ward], [City], [Latitude], [Longitude], [PhoneNumber], [LogoUrl], [Status], [StoreFlags], [CreatedAt], [TrustScore], [ReviewNotes], [CoverCloudinaryId], [CoverUrl], [LogoCloudinaryId], [StorefrontImageUrl], [ReferenceLink]) VALUES (N'21000000-0000-0000-0000-000000000004', N'SushiLAB', N'Sushi, sashimi và combo Nhật cuối ngày.', N'151 P. Phùng Hưng, Phường Hoàn Kiếm', N'Hoàn Kiếm', N'Hà Nội', CAST(10.794270 AS Decimal(9, 6)), CAST(106.729117 AS Decimal(9, 6)), N'0346863468', N'https://ui-avatars.com/api/?name=SushiLAB&background=random', 1, 2, CAST(N'2026-05-25T16:09:17.1117090' AS DateTime2), 100, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Stores] ([Id], [Name], [Description], [DetailedAddress], [Ward], [City], [Latitude], [Longitude], [PhoneNumber], [LogoUrl], [Status], [StoreFlags], [CreatedAt], [TrustScore], [ReviewNotes], [CoverCloudinaryId], [CoverUrl], [LogoCloudinaryId], [StorefrontImageUrl], [ReferenceLink]) VALUES (N'21000000-0000-0000-0000-000000000005', N'CoBa Bakery', N'Pastry và bánh ngọt thủ công.', N'69 P. Hàng Gai, Phường Hoàn Kiếm', N'Hoàn Kiếm', N'Hà Nội', NULL, NULL, N'0966333304', N'https://ui-avatars.com/api/?name=CoBa+Bakery&background=random', 0, 2, CAST(N'2026-05-30T17:35:28.1913789' AS DateTime2), 100, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Stores] ([Id], [Name], [Description], [DetailedAddress], [Ward], [City], [Latitude], [Longitude], [PhoneNumber], [LogoUrl], [Status], [StoreFlags], [CreatedAt], [TrustScore], [ReviewNotes], [CoverCloudinaryId], [CoverUrl], [LogoCloudinaryId], [StorefrontImageUrl], [ReferenceLink]) VALUES (N'21000000-0000-0000-0000-000000000006', N'LAZY Patisserie', N'French pastry và dessert box.', N'10 Ng. 12B P. Lý Nam Đế, Phường Hoàn Kiếm', N'Hoàn Kiếm', N'Hà Nội', NULL, NULL, N'0799160501', N'https://ui-avatars.com/api/?name=LAZY+Patisserie&background=random', 0, 2, CAST(N'2026-05-30T17:35:28.1913789' AS DateTime2), 100, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Stores] ([Id], [Name], [Description], [DetailedAddress], [Ward], [City], [Latitude], [Longitude], [PhoneNumber], [LogoUrl], [Status], [StoreFlags], [CreatedAt], [TrustScore], [ReviewNotes], [CoverCloudinaryId], [CoverUrl], [LogoCloudinaryId], [StorefrontImageUrl], [ReferenceLink]) VALUES (N'21000000-0000-0000-0000-000000000007', N'Tossful Salad Bar - Capital Place', N'Salad và healthy meal.', N'29 P. Liễu Giai, Phường Ngọc Hà', N'Ba Đình', N'Hà Nội', NULL, NULL, N'0828565166', N'https://ui-avatars.com/api/?name=Tossful+Salad+Bar+-+Capital+Place&background=random', 0, 2, CAST(N'2026-05-30T17:35:28.1913789' AS DateTime2), 100, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Stores] ([Id], [Name], [Description], [DetailedAddress], [Ward], [City], [Latitude], [Longitude], [PhoneNumber], [LogoUrl], [Status], [StoreFlags], [CreatedAt], [TrustScore], [ReviewNotes], [CoverCloudinaryId], [CoverUrl], [LogoCloudinaryId], [StorefrontImageUrl], [ReferenceLink]) VALUES (N'21000000-0000-0000-0000-000000000008', N'ChanMia Bakery', N'Bakery chuyên bánh mì và bánh ngọt.', N'17 P. Khúc Hạo, Phường Ba Đình', N'Ba Đình', N'Hà Nội', NULL, NULL, N'0936493535', N'https://ui-avatars.com/api/?name=ChanMia+Bakery&background=random', 0, 2, CAST(N'2026-05-30T17:35:28.1913789' AS DateTime2), 100, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Stores] ([Id], [Name], [Description], [DetailedAddress], [Ward], [City], [Latitude], [Longitude], [PhoneNumber], [LogoUrl], [Status], [StoreFlags], [CreatedAt], [TrustScore], [ReviewNotes], [CoverCloudinaryId], [CoverUrl], [LogoCloudinaryId], [StorefrontImageUrl], [ReferenceLink]) VALUES (N'21000000-0000-0000-0000-000000000009', N'Vanille Pastry', N'Cake shop và dessert.', N'14 KTT 12A Lý Nam Đế, Phường Hoàn Kiếm', N'Hoàn Kiếm', N'Hà Nội', NULL, NULL, N'0983372112', N'https://ui-avatars.com/api/?name=Vanille+Pastry&background=random', 0, 2, CAST(N'2026-05-30T17:35:28.1913789' AS DateTime2), 100, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Stores] ([Id], [Name], [Description], [DetailedAddress], [Ward], [City], [Latitude], [Longitude], [PhoneNumber], [LogoUrl], [Status], [StoreFlags], [CreatedAt], [TrustScore], [ReviewNotes], [CoverCloudinaryId], [CoverUrl], [LogoCloudinaryId], [StorefrontImageUrl], [ReferenceLink]) VALUES (N'21000000-0000-0000-0000-000000000010', N'King Roti Hàng Gai', N'Bánh ngọt và bánh mì nướng.', N'34 P. Hàng Gai, Phường Hoàn Kiếm', N'Hoàn Kiếm', N'Hà Nội', NULL, NULL, N'0906036299', N'https://ui-avatars.com/api/?name=King+Roti+Hàng+Gai&background=random', 0, 2, CAST(N'2026-05-30T17:35:28.1913789' AS DateTime2), 100, NULL, NULL, NULL, NULL, NULL, NULL)
INSERT [dbo].[Stores] ([Id], [Name], [Description], [DetailedAddress], [Ward], [City], [Latitude], [Longitude], [PhoneNumber], [LogoUrl], [Status], [StoreFlags], [CreatedAt], [TrustScore], [ReviewNotes], [CoverCloudinaryId], [CoverUrl], [LogoCloudinaryId], [StorefrontImageUrl], [ReferenceLink]) VALUES (N'52c5b657-1634-49a3-8710-8c8e43293677', N'sa', N's', N'nhà số 1', N'Huyện Ba Vì', N'Thành phố Hà Nội', CAST(21.149870 AS Decimal(9, 6)), CAST(105.371770 AS Decimal(9, 6)), N'0867778085', NULL, 3, 0, CAST(N'2026-06-06T10:05:53.2601442' AS DateTime2), 100, NULL, NULL, NULL, NULL, NULL, NULL)
GO
INSERT [dbo].[StoreStaffs] ([Id], [StoreId], [UserId], [StaffRole], [StaffFlags], [JoinedAt]) VALUES (N'f1000000-0000-0000-0000-000000000001', N'21000000-0000-0000-0000-000000000001', N'13000000-0000-0000-0000-000000000001', 0, 1, CAST(N'2026-05-25T16:09:17.1157097' AS DateTime2))
INSERT [dbo].[StoreStaffs] ([Id], [StoreId], [UserId], [StaffRole], [StaffFlags], [JoinedAt]) VALUES (N'f1000000-0000-0000-0000-000000000002', N'21000000-0000-0000-0000-000000000001', N'14000000-0000-0000-0000-000000000001', 2, 1, CAST(N'2026-05-25T16:09:17.1157097' AS DateTime2))
INSERT [dbo].[StoreStaffs] ([Id], [StoreId], [UserId], [StaffRole], [StaffFlags], [JoinedAt]) VALUES (N'f1000000-0000-0000-0000-000000000003', N'21000000-0000-0000-0000-000000000002', N'13000000-0000-0000-0000-000000000002', 0, 1, CAST(N'2026-05-25T16:09:17.1157097' AS DateTime2))
INSERT [dbo].[StoreStaffs] ([Id], [StoreId], [UserId], [StaffRole], [StaffFlags], [JoinedAt]) VALUES (N'f1000000-0000-0000-0000-000000000004', N'21000000-0000-0000-0000-000000000002', N'14000000-0000-0000-0000-000000000002', 1, 1, CAST(N'2026-05-25T16:09:17.1157097' AS DateTime2))
INSERT [dbo].[StoreStaffs] ([Id], [StoreId], [UserId], [StaffRole], [StaffFlags], [JoinedAt]) VALUES (N'f1000000-0000-0000-0000-000000000005', N'21000000-0000-0000-0000-000000000003', N'13000000-0000-0000-0000-000000000003', 0, 1, CAST(N'2026-05-25T16:09:17.1157097' AS DateTime2))
INSERT [dbo].[StoreStaffs] ([Id], [StoreId], [UserId], [StaffRole], [StaffFlags], [JoinedAt]) VALUES (N'a9282167-d576-4221-b298-3a1fe503153f', N'52c5b657-1634-49a3-8710-8c8e43293677', N'2f225ee8-8b15-46d9-99fa-ac33cc3bf9d2', 0, 1, CAST(N'2026-06-06T10:05:53.2610658' AS DateTime2))
GO
INSERT [dbo].[StoreSubscriptions] ([Id], [StoreId], [PlanId], [StartDate], [EndDate], [Status], [CreatedAt], [OrderCode], [UserId]) VALUES (N'61000000-0000-0000-0000-000000000001', N'21000000-0000-0000-0000-000000000001', N'd1000000-0000-0000-0000-000000000002', CAST(N'2026-05-10T16:09:17.1253463' AS DateTime2), CAST(N'2026-06-09T16:09:17.1253463' AS DateTime2), 0, CAST(N'2026-05-25T16:09:17.1253463' AS DateTime2), NULL, NULL)
INSERT [dbo].[StoreSubscriptions] ([Id], [StoreId], [PlanId], [StartDate], [EndDate], [Status], [CreatedAt], [OrderCode], [UserId]) VALUES (N'61000000-0000-0000-0000-000000000002', N'21000000-0000-0000-0000-000000000002', N'd1000000-0000-0000-0000-000000000003', CAST(N'2026-05-20T16:09:17.1253463' AS DateTime2), CAST(N'2026-06-19T16:09:17.1253463' AS DateTime2), 0, CAST(N'2026-05-25T16:09:17.1253463' AS DateTime2), NULL, NULL)
INSERT [dbo].[StoreSubscriptions] ([Id], [StoreId], [PlanId], [StartDate], [EndDate], [Status], [CreatedAt], [OrderCode], [UserId]) VALUES (N'61000000-0000-0000-0000-000000000003', N'21000000-0000-0000-0000-000000000003', N'd1000000-0000-0000-0000-000000000001', CAST(N'2026-05-05T16:09:17.1253463' AS DateTime2), CAST(N'2026-06-04T16:09:17.1253463' AS DateTime2), 0, CAST(N'2026-05-25T16:09:17.1253463' AS DateTime2), NULL, NULL)
INSERT [dbo].[StoreSubscriptions] ([Id], [StoreId], [PlanId], [StartDate], [EndDate], [Status], [CreatedAt], [OrderCode], [UserId]) VALUES (N'61000000-0000-0000-0000-000000000004', N'21000000-0000-0000-0000-000000000001', N'd1000000-0000-0000-0000-000000000001', CAST(N'2026-03-25T16:09:17.1253463' AS DateTime2), CAST(N'2026-04-25T16:09:17.1253463' AS DateTime2), 1, CAST(N'2026-05-25T16:09:17.1253463' AS DateTime2), NULL, NULL)
GO
INSERT [dbo].[StoreWallets] ([Id], [StoreId], [AvailableBalance], [PendingBalance], [CreatedAt], [UpdatedAt]) VALUES (N'33e82ab0-a206-4000-a69c-3ce808afb32b', N'21000000-0000-0000-0000-000000000001', CAST(34200.00 AS Decimal(18, 2)), CAST(0.00 AS Decimal(18, 2)), CAST(N'2026-06-19T17:41:27.5666667' AS DateTime2), CAST(N'2026-06-19T17:41:27.4243423' AS DateTime2))
GO
INSERT [dbo].[SubscriptionPlans] ([Id], [Name], [Description], [MonthlyPrice], [PlanFlags], [MaxActiveListings], [HasCustomBanner], [HasFeaturedBadge], [PriorityLevel], [AnalyticsLevel]) VALUES (N'd1000000-0000-0000-0000-000000000001', N'Gói Miễn Phí', N'Đăng tối đa 3 tin thanh lý/tháng. Phù hợp cho cửa hàng nhỏ mới bắt đầu', CAST(10000.00 AS Decimal(18, 2)), 2, NULL, 0, 0, 0, 0)
INSERT [dbo].[SubscriptionPlans] ([Id], [Name], [Description], [MonthlyPrice], [PlanFlags], [MaxActiveListings], [HasCustomBanner], [HasFeaturedBadge], [PriorityLevel], [AnalyticsLevel]) VALUES (N'd1000000-0000-0000-0000-000000000002', N'Gói Cơ Bản', N'Đăng tối đa 30 tin/tháng. Hiển thị logo cửa hàng trong kết quả tìm kiếm.', CAST(199000.00 AS Decimal(18, 2)), 2, NULL, 0, 0, 0, 0)
INSERT [dbo].[SubscriptionPlans] ([Id], [Name], [Description], [MonthlyPrice], [PlanFlags], [MaxActiveListings], [HasCustomBanner], [HasFeaturedBadge], [PriorityLevel], [AnalyticsLevel]) VALUES (N'd1000000-0000-0000-0000-000000000003', N'Gói Nâng Cao', N'Tin không giới hạn. Ưu tiên hiển thị, thống kê chi tiết, hỗ trợ 24/7.', CAST(499000.00 AS Decimal(18, 2)), 2, NULL, 0, 0, 0, 0)
INSERT [dbo].[SubscriptionPlans] ([Id], [Name], [Description], [MonthlyPrice], [PlanFlags], [MaxActiveListings], [HasCustomBanner], [HasFeaturedBadge], [PriorityLevel], [AnalyticsLevel]) VALUES (N'd1000000-0000-0000-0000-000000000004', N'Gói Doanh Nghiệp', N'Dành cho chuỗi nhiều chi nhánh. Quản lý tập trung, API riêng.', CAST(1200000.00 AS Decimal(18, 2)), 2, NULL, 0, 0, 0, 0)
INSERT [dbo].[SubscriptionPlans] ([Id], [Name], [Description], [MonthlyPrice], [PlanFlags], [MaxActiveListings], [HasCustomBanner], [HasFeaturedBadge], [PriorityLevel], [AnalyticsLevel]) VALUES (N'11111111-1111-1111-1111-111111111111', N'Free', N'Tối đa 5 tin đăng.Thống kê cơ bản', CAST(0.00 AS Decimal(18, 2)), 1, 5, 0, 0, 0, 0)
INSERT [dbo].[SubscriptionPlans] ([Id], [Name], [Description], [MonthlyPrice], [PlanFlags], [MaxActiveListings], [HasCustomBanner], [HasFeaturedBadge], [PriorityLevel], [AnalyticsLevel]) VALUES (N'22222222-2222-2222-2222-222222222222', N'Plus', N'Tối đa 15 tin đăng.Banner tùy chỉnh.Thống kê nâng cao', CAST(149000.00 AS Decimal(18, 2)), 1, 15, 1, 0, 1, 1)
INSERT [dbo].[SubscriptionPlans] ([Id], [Name], [Description], [MonthlyPrice], [PlanFlags], [MaxActiveListings], [HasCustomBanner], [HasFeaturedBadge], [PriorityLevel], [AnalyticsLevel]) VALUES (N'33333333-3333-3333-3333-333333333333', N'Premium', N'Không giới hạn tin đăng.Banner tùy chỉnh.Huy hiệu Nổi bật.Ưu tiên lên top tìm kiếm.Thống kê cao cấp', CAST(399000.00 AS Decimal(18, 2)), 1, NULL, 1, 1, 2, 2)
GO
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'b1000000-0000-0000-0000-000000000001', N'11000000-0000-0000-0000-000000000001', N'a1000000-0000-0000-0000-000000000001')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'b1000000-0000-0000-0000-000000000002', N'12000000-0000-0000-0000-000000000001', N'a1000000-0000-0000-0000-000000000002')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'b1000000-0000-0000-0000-000000000006', N'13000000-0000-0000-0000-000000000001', N'a1000000-0000-0000-0000-000000000003')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'b1000000-0000-0000-0000-000000000009', N'14000000-0000-0000-0000-000000000001', N'a1000000-0000-0000-0000-000000000003')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'b1000000-0000-0000-0000-000000000003', N'12000000-0000-0000-0000-000000000002', N'a1000000-0000-0000-0000-000000000002')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'b1000000-0000-0000-0000-000000000007', N'13000000-0000-0000-0000-000000000002', N'a1000000-0000-0000-0000-000000000003')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'b1000000-0000-0000-0000-000000000010', N'14000000-0000-0000-0000-000000000002', N'a1000000-0000-0000-0000-000000000003')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'b1000000-0000-0000-0000-000000000004', N'12000000-0000-0000-0000-000000000003', N'a1000000-0000-0000-0000-000000000002')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'b1000000-0000-0000-0000-000000000008', N'13000000-0000-0000-0000-000000000003', N'a1000000-0000-0000-0000-000000000003')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'b1000000-0000-0000-0000-000000000005', N'12000000-0000-0000-0000-000000000004', N'a1000000-0000-0000-0000-000000000002')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'c96129c2-2d0a-4c91-964e-b0d1edf13fcd', N'7aa19d55-e47b-4dc8-85d3-0c900fa43b6e', N'a1000000-0000-0000-0000-000000000002')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'97868dee-7ca3-4443-a0c6-90e2d06aff03', N'09d0d8af-00e3-47da-93fc-2beac9ac4c33', N'a1000000-0000-0000-0000-000000000002')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'f57aa248-cc1a-4142-b303-ae184388c82f', N'118407c3-5466-42c2-8fb9-483cfb438cd0', N'a1000000-0000-0000-0000-000000000002')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'f500a934-2e9b-4e85-9d0c-b5ca1ac90595', N'74911152-5345-4c53-8160-7fbdd15436e6', N'a1000000-0000-0000-0000-000000000002')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'2dbbed61-c482-4567-89ed-729538fe7da0', N'bcb83b17-b930-461a-99f7-9d32ceabd0f0', N'a1000000-0000-0000-0000-000000000001')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'35a60d70-8598-4d58-a810-1b2727660d01', N'2f225ee8-8b15-46d9-99fa-ac33cc3bf9d2', N'a1000000-0000-0000-0000-000000000002')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'2a9357c3-c6a6-4ac7-ae7d-f35c0bd11bdf', N'b76004c8-b5f4-425a-8099-c449ea122fff', N'a1000000-0000-0000-0000-000000000002')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'ba9b6f93-10b1-4f47-966c-4bbc6b9b5e90', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'a1000000-0000-0000-0000-000000000002')
INSERT [dbo].[UserRoles] ([Id], [UserId], [RoleId]) VALUES (N'ef115fb5-0637-4344-b0ed-a0713ee420ea', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'a1000000-0000-0000-0000-000000000002')
GO
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'11000000-0000-0000-0000-000000000001', N'admin@savefood.vn', N'$2a$12$h4n4L4NzKvL0RyX0PlsSr.itM2OatP5/Z8mcOgEnUPTfCWDKjHpPm', N'Nguyễn Quản Trị', N'0901000001', N'1 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội', N'https://cdn.savefood.vn/avatars/admin01.jpg', 0, 5, CAST(N'2026-05-25T16:09:17.0869565' AS DateTime2), N'admin@savefood.vn', N'admin@savefood.vn', NULL, NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'12000000-0000-0000-0000-000000000001', N'lan.nguyen@gmail.com', N'$2a$12$h4n4L4NzKvL0RyX0PlsSr.itM2OatP5/Z8mcOgEnUPTfCWDKjHpPm', N'Nguyễn Thị Lan', N'0912345601', N'25 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội', N'https://cdn.savefood.vn/avatars/lan.jpg', 0, 4, CAST(N'2026-05-25T16:09:17.0869565' AS DateTime2), N'lan.nguyen@gmail.com', N'lannguyen@gmail.com', NULL, NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'13000000-0000-0000-0000-000000000001', N'owner.banh.mi@savefood.vn', N'$2a$12$h4n4L4NzKvL0RyX0PlsSr.itM2OatP5/Z8mcOgEnUPTfCWDKjHpPm', N'Hoàng Thị Mai', N'0956789001', N'12 Phan Đình Phùng, Ba Đình, Hà Nội', N'https://cdn.savefood.vn/avatars/owner_mai.jpg', 0, 4, CAST(N'2026-05-25T16:09:17.0869565' AS DateTime2), N'owner.banh.mi@savefood.vn', N'owner.banh.mi@savefood.vn', NULL, NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'14000000-0000-0000-0000-000000000001', N'staff.banh.mi@savefood.vn', N'$2a$12$h4n4L4NzKvL0RyX0PlsSr.itM2OatP5/Z8mcOgEnUPTfCWDKjHpPm', N'Nguyễn Văn An', N'0989012301', NULL, NULL, 0, 5, CAST(N'2026-05-25T16:09:17.0869565' AS DateTime2), N'staff.banh.mi@savefood.vn', N'staff.banh.mi@savefood.vn', NULL, NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'12000000-0000-0000-0000-000000000002', N'minh.tran@gmail.com', N'$2a$12$h4n4L4NzKvL0RyX0PlsSr.itM2OatP5/Z8mcOgEnUPTfCWDKjHpPm', N'Trần Văn Minh', N'0923456702', N'88 Trần Duy Hưng, Cầu Giấy, Hà Nội', N'https://cdn.savefood.vn/avatars/minh.jpg', 0, 5, CAST(N'2026-05-25T16:09:17.0869565' AS DateTime2), N'minh.tran@gmail.com', N'minhtran@gmail.com', NULL, NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'13000000-0000-0000-0000-000000000002', N'owner.cafe@savefood.vn', N'$2a$12$h4n4L4NzKvL0RyX0PlsSr.itM2OatP5/Z8mcOgEnUPTfCWDKjHpPm', N'Phạm Minh Tuấn', N'0967890102', N'5 Nguyễn Văn Cừ, Quận 5, TP.HCM', N'https://cdn.savefood.vn/avatars/owner_tuan.jpg', 0, 5, CAST(N'2026-05-25T16:09:17.0869565' AS DateTime2), N'owner.cafe@savefood.vn', N'owner.cafe@savefood.vn', NULL, NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'14000000-0000-0000-0000-000000000002', N'staff.cafe@savefood.vn', N'$2a$12$h4n4L4NzKvL0RyX0PlsSr.itM2OatP5/Z8mcOgEnUPTfCWDKjHpPm', N'Lê Thị Cúc', N'0990123402', NULL, NULL, 0, 4, CAST(N'2026-05-25T16:09:17.0869565' AS DateTime2), N'staff.cafe@savefood.vn', N'staff.cafe@savefood.vn', NULL, NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'12000000-0000-0000-0000-000000000003', N'huong.pham@gmail.com', N'$2a$12$h4n4L4NzKvL0RyX0PlsSr.itM2OatP5/Z8mcOgEnUPTfCWDKjHpPm', N'Phạm Thị Hương', N'0934567803', N'15 Nguyễn Huệ, Quận 1, TP.HCM', NULL, 0, 0, CAST(N'2026-05-25T16:09:17.0869565' AS DateTime2), N'huong.pham@gmail.com', N'huongpham@gmail.com', NULL, NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'13000000-0000-0000-0000-000000000003', N'owner.sushi@savefood.vn', N'$2a$12$h4n4L4NzKvL0RyX0PlsSr.itM2OatP5/Z8mcOgEnUPTfCWDKjHpPm', N'Trần Thị Bích', N'0978901203', N'33 Lê Duẩn, Hải Châu, Đà Nẵng', NULL, 0, 4, CAST(N'2026-05-25T16:09:17.0869565' AS DateTime2), N'owner.sushi@savefood.vn', N'owner.sushi@savefood.vn', NULL, NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'12000000-0000-0000-0000-000000000004', N'duc.le@yahoo.com', N'$2a$12$h4n4L4NzKvL0RyX0PlsSr.itM2OatP5/Z8mcOgEnUPTfCWDKjHpPm', N'Lê Văn Đức', N'0945678904', N'42 Bạch Đằng, Hải Châu, Đà Nẵng', NULL, 0, 5, CAST(N'2026-05-25T16:09:17.0869565' AS DateTime2), N'duc.le@yahoo.com', N'duc.le@yahoo.com', NULL, NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'7aa19d55-e47b-4dc8-85d3-0c900fa43b6e', N'hungkieu2@gmail.com', N'$2a$11$4OJNdS/sQKyXFUvWR2M4j.n6HUtxFWJb0sFvUk6eBEWoTcj2HzP46', N'Kieu Dinh Hung', N'0912345678', NULL, NULL, 0, 0, CAST(N'2026-06-17T15:34:50.3216048' AS DateTime2), N'hungkieu2', N'hungkieu2@gmail.com', NULL, NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'09d0d8af-00e3-47da-93fc-2beac9ac4c33', N'trantrunghieu31k@gmail.com', N'$2a$12$h4n4L4NzKvL0RyX0PlsSr.itM2OatP5/Z8mcOgEnUPTfCWDKjHpPm', N'Hiếu Trần Trung', NULL, NULL, N'https://res.cloudinary.com/dpbaa45ft/image/upload/v1779789276/mzhaklsltmmg15tux9bw.png', 0, 4, CAST(N'2026-05-26T09:53:22.2641614' AS DateTime2), N'trantrunghieu31k', N'trantrunghieu31k@gmail.com', N'mzhaklsltmmg15tux9bw', NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'118407c3-5466-42c2-8fb9-483cfb438cd0', N'hungkieu3@gmail.com', N'$2a$11$PmMVjS9UPJiXHBscbl3GO.fcM3aXmMyRWrojamEw90HVgXX1l4EN.', N'Kieu Dinh Hung', N'0912345678', NULL, NULL, 0, 0, CAST(N'2026-06-17T15:39:58.8188275' AS DateTime2), N'hungkieu3', N'hungkieu3@gmail.com', NULL, NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'74911152-5345-4c53-8160-7fbdd15436e6', N'hung70919@gmail.com', N'$2a$11$0YNtVdV/JFkErS4fldgoMODAGC197ddVO7I0GoUyNZD96gpNXevM.', N'd', NULL, NULL, N'https://lh3.googleusercontent.com/a/ACg8ocI1NN4rsctikasz77i4mNb3Jza0M0yrcXSKOcY7m9UqKiYGv1Sv=s96-c', 0, 4, CAST(N'2026-05-26T13:42:31.6068623' AS DateTime2), N'hung70919', N'hung70919@gmail.com', NULL, NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'bcb83b17-b930-461a-99f7-9d32ceabd0f0', N'admin@gmail.com', N'$2a$11$O3NCfCbJ6xhecQDD36sKuO/20CBdLDZD7khiQaci1W/H9ycWOoV/W', N'Admin', NULL, NULL, NULL, 0, 4, CAST(N'2026-06-19T18:24:59.8820079' AS DateTime2), N'admin', N'admin@gmail.com', NULL, NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'2f225ee8-8b15-46d9-99fa-ac33cc3bf9d2', N'fitnesstracker062024@gmail.com', N'5035a612-4577-4631-b7ca-7e2604dd692c', N'Tracker Fitness', NULL, NULL, N'https://lh3.googleusercontent.com/a/ACg8ocK0J-15enAr1_X00TR8TzHbCnpHctgnaCS8KhuZilB3Fnry4wA=s96-c', 0, 4, CAST(N'2026-06-06T09:52:54.4738509' AS DateTime2), N'fitnesstracker062024', N'fitnesstracker062024@gmail.com', NULL, NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'b76004c8-b5f4-425a-8099-c449ea122fff', N'hungkieu1612@gmail.com', N'$2a$11$EEWV068eaFJeC738L/QBz.SF2yrpl2NDrbsIzZur6SzFQI2tUET2e', N'KIEU DINH HUNG', N'0867778085', NULL, N'https://lh3.googleusercontent.com/a/ACg8ocIfCMggsCHJvTq_JGda5nzpAcFQl8hyPJMSlalP6ZYZDeKBTw=s96-c', 0, 4, CAST(N'2026-05-27T10:16:06.9179270' AS DateTime2), N'lethib', N'hungkieu1612@gmail.com', NULL, NULL, NULL)
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'hungkieu50919@gmail.com', N'$2a$11$2/GXmoyDffc1w.7Nhtb78./cFlyIhf7xDqPRVjLAjLyBqJHViUOD6', N'KIEU DINH HUNG', N'0867778058', N'Vị trí đã chọn', N'https://lh3.googleusercontent.com/a/ACg8ocLc_H6w8YvPFZkLPzmOZ1zUCSN_NSpQoiGz3__NBcn5EdRfc2L5eQ=s96-c', 0, 4, CAST(N'2026-06-17T15:16:35.4199261' AS DateTime2), N'hungkieu', N'hungkieu50919@gmail.com', NULL, CAST(20.993460 AS Decimal(9, 6)), CAST(105.573820 AS Decimal(9, 6)))
INSERT [dbo].[Users] ([Id], [Email], [PasswordHash], [FullName], [PhoneNumber], [Address], [AvatarUrl], [Status], [UserFlags], [CreatedAt], [Username], [NormalizedEmail], [ImgCloudinaryId], [Latitude], [Longitude]) VALUES (N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'hungk60919@gmail.com', N'2831b57f-6863-41da-946a-bbd51dfae575', N'kieu hung', NULL, N'Vị trí đã chọn', N'https://res.cloudinary.com/dpbaa45ft/image/upload/v1779797674/tcodqkcujd0rt6fqmqvj.jpg', 0, 4, CAST(N'2026-05-26T12:13:14.3700531' AS DateTime2), N'hungk60919', N'hungk60919@gmail.com', N'tcodqkcujd0rt6fqmqvj', CAST(20.993016 AS Decimal(9, 6)), CAST(105.573639 AS Decimal(9, 6)))
GO
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'c1000000-0000-0000-0000-000000000001', N'12000000-0000-0000-0000-000000000001', N'$2a$12$REFRESHTOKEN_HASH_LAN', CAST(N'2026-06-24T16:09:17.0987492' AS DateTime2), NULL, CAST(N'2026-05-25T16:09:17.0987492' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'c1000000-0000-0000-0000-000000000002', N'12000000-0000-0000-0000-000000000002', N'$2a$12$REFRESHTOKEN_HASH_MINH', CAST(N'2026-06-24T16:09:17.0987492' AS DateTime2), NULL, CAST(N'2026-05-25T16:09:17.0987492' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'c1000000-0000-0000-0000-000000000003', N'12000000-0000-0000-0000-000000000001', N'$2a$12$REFRESHTOKEN_HASH_LAN_OLD', CAST(N'2026-06-24T16:09:17.0987492' AS DateTime2), CAST(N'2026-05-25T16:09:17.0987492' AS DateTime2), CAST(N'2026-05-25T16:09:17.0987492' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'7ec4346c-4280-422a-9f5f-00df9445b6e1', N'11000000-0000-0000-0000-000000000001', N'dbc595da-cb7a-402e-9a69-53f6ffb2d1aa', CAST(N'2026-06-30T12:52:42.1661829' AS DateTime2), CAST(N'2026-05-31T13:11:24.2369753' AS DateTime2), CAST(N'2026-05-31T12:52:42.1662530' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'2a9b46a9-d171-46e1-841d-06c02c5056d4', N'b76004c8-b5f4-425a-8099-c449ea122fff', N'ebc4610c-1ebf-4aac-a3e3-050e9b64b2b4', CAST(N'2026-07-06T15:38:07.3664630' AS DateTime2), CAST(N'2026-06-06T15:38:10.4516802' AS DateTime2), CAST(N'2026-06-06T15:38:07.3665361' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'63efd40f-9994-49f4-a1d8-07468811e7ac', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'cc7e1274-4643-4cf5-b45e-c86046d509e5', CAST(N'2026-07-06T16:02:08.2922906' AS DateTime2), CAST(N'2026-06-06T16:36:43.2673674' AS DateTime2), CAST(N'2026-06-06T16:02:08.2923015' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'0a257d33-204f-44fe-a94f-0c36509531dc', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'899c3205-a2fd-4713-9c4a-e6f680a79d3b', CAST(N'2026-06-28T02:42:34.2473236' AS DateTime2), CAST(N'2026-05-29T03:05:02.4695257' AS DateTime2), CAST(N'2026-05-29T02:42:34.2480053' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'dc69e57e-010a-41b2-8710-11745282d009', N'13000000-0000-0000-0000-000000000001', N'7c97011b-c47a-4782-ae8b-85db0d109c67', CAST(N'2026-06-30T16:43:10.2285549' AS DateTime2), CAST(N'2026-06-06T09:52:43.6716850' AS DateTime2), CAST(N'2026-05-31T16:43:10.2285580' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'ecccc6d9-c671-4a3e-957f-11b24c836527', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'8d6e1c48-8b64-4589-bd1b-6c57d68069cb', CAST(N'2026-07-19T15:37:49.8880832' AS DateTime2), NULL, CAST(N'2026-06-19T15:37:49.8880961' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'dbb85c6a-42d3-42ee-a94b-12ba9c47d1f4', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'ec2977f3-c8cc-4472-adc3-e3fa68399eeb', CAST(N'2026-07-06T15:19:14.7008830' AS DateTime2), CAST(N'2026-06-06T15:30:01.2283405' AS DateTime2), CAST(N'2026-06-06T15:19:14.7009579' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'46af2741-09f4-4ba2-b95f-175a0d57205a', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'52e87d6e-00f8-450d-9d21-71d569f727b7', CAST(N'2026-06-28T15:49:32.9725543' AS DateTime2), NULL, CAST(N'2026-05-29T15:49:32.9728070' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'4c82e617-0d8f-43d4-abe1-175af44b01a8', N'11000000-0000-0000-0000-000000000001', N'fa0f3999-c63d-494d-8d1a-78ed418e7e0d', CAST(N'2026-07-06T15:59:46.6392740' AS DateTime2), CAST(N'2026-06-06T16:02:02.3898433' AS DateTime2), CAST(N'2026-06-06T15:59:46.6393920' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'2a48381b-5ff0-419c-afee-19ed581ac698', N'13000000-0000-0000-0000-000000000001', N'30f4aa79-6948-4ec7-80f4-24a816ffc1da', CAST(N'2026-06-30T10:18:58.0692800' AS DateTime2), CAST(N'2026-05-31T10:21:35.8239892' AS DateTime2), CAST(N'2026-05-31T10:18:58.0693596' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'3087544a-7888-47a0-9dcf-1c98ef9b98c1', N'11000000-0000-0000-0000-000000000001', N'2694650c-4419-40dd-990f-e5987c8032ac', CAST(N'2026-06-25T12:14:34.8250543' AS DateTime2), CAST(N'2026-05-26T13:46:43.2928998' AS DateTime2), CAST(N'2026-05-26T12:14:34.8250559' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'b5b382ef-caf9-409d-808d-239fcf4e4af9', N'11000000-0000-0000-0000-000000000001', N'4c81a744-df05-4cbb-a19c-0ddf0824874c', CAST(N'2026-06-25T16:45:03.7895122' AS DateTime2), CAST(N'2026-05-27T10:16:23.0350243' AS DateTime2), CAST(N'2026-05-26T16:45:03.7895749' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'7d599a7d-8a95-4cdf-a131-2491ab2c307e', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'c5421629-f056-425c-99c7-7ab1a08f62d5', CAST(N'2026-06-27T08:28:57.2813035' AS DateTime2), CAST(N'2026-05-28T08:51:45.7871991' AS DateTime2), CAST(N'2026-05-28T08:28:57.2816481' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'ace60bac-2138-4008-a141-24cf4a3729c3', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'80bd99ce-bc79-49a8-b010-88f8a7fd0022', CAST(N'2026-06-30T09:48:28.1766845' AS DateTime2), CAST(N'2026-05-31T09:50:56.3469547' AS DateTime2), CAST(N'2026-05-31T09:48:28.1766937' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'514a59b1-89ee-482e-84b2-25cbbabcddd8', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'bb1d0a5e-b5bc-4775-9588-741ab43a8e12', CAST(N'2026-06-28T08:49:03.4061126' AS DateTime2), CAST(N'2026-05-29T09:39:07.7904807' AS DateTime2), CAST(N'2026-05-29T08:49:03.4066610' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'533adfb4-737d-4c1d-b16c-25ee44e4efa3', N'11000000-0000-0000-0000-000000000001', N'0cede7a5-d9ab-4991-ac38-efb7ed66185d', CAST(N'2026-06-25T13:50:52.1398414' AS DateTime2), CAST(N'2026-05-26T16:44:56.9463033' AS DateTime2), CAST(N'2026-05-26T13:50:52.1398434' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'789741b1-c5cf-4d30-ba49-28be9fbcb9f3', N'11000000-0000-0000-0000-000000000001', N'4162d582-f000-4acc-be12-086c373bce5f', CAST(N'2026-06-27T01:15:50.1241853' AS DateTime2), CAST(N'2026-05-28T01:20:31.3104426' AS DateTime2), CAST(N'2026-05-28T01:15:50.1242338' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'8e55f3e2-4035-4475-a73f-290f240aae94', N'13000000-0000-0000-0000-000000000001', N'38c84c59-d931-48da-9c8f-6b51fc07c5a5', CAST(N'2026-07-19T17:25:05.5139066' AS DateTime2), CAST(N'2026-06-19T17:34:32.7095822' AS DateTime2), CAST(N'2026-06-19T17:25:05.5139115' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'b58f04fc-de3b-4809-97f9-2956970fc075', N'11000000-0000-0000-0000-000000000001', N'3080d0fa-fbd6-45fd-b584-8fcd230a6fe2', CAST(N'2026-07-17T15:48:33.5064834' AS DateTime2), NULL, CAST(N'2026-06-17T15:48:33.5070357' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'143f2882-cac1-4a26-b349-2a61e1ba7855', N'13000000-0000-0000-0000-000000000001', N'31912ff3-f4b2-43c6-906d-52303707ba2b', CAST(N'2026-06-30T16:00:00.7117862' AS DateTime2), CAST(N'2026-05-31T16:39:15.2093123' AS DateTime2), CAST(N'2026-05-31T16:00:00.7121497' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'b217a28c-e033-4ecb-9509-2b874314c1f2', N'13000000-0000-0000-0000-000000000001', N'846e3575-4600-477f-9b94-49e1ea8fcbfc', CAST(N'2026-06-30T10:21:38.2335151' AS DateTime2), CAST(N'2026-05-31T10:22:19.0915856' AS DateTime2), CAST(N'2026-05-31T10:21:38.2335182' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'e45c048c-cf98-49b4-9fee-30c6374b84a1', N'11000000-0000-0000-0000-000000000001', N'9d490a19-16c5-4672-8231-aa9344e94045', CAST(N'2026-06-26T15:20:15.0993946' AS DateTime2), NULL, CAST(N'2026-05-27T15:20:15.0996317' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'a6b84f37-1d86-444d-8c29-313cc840609c', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'25849710-7098-4abd-83c3-0da1d4a1ad89', CAST(N'2026-07-20T04:02:24.6010211' AS DateTime2), CAST(N'2026-06-20T04:36:49.2928413' AS DateTime2), CAST(N'2026-06-20T04:02:24.6011169' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'e1231e03-d811-4df1-8e7c-3353f3be0a1d', N'2f225ee8-8b15-46d9-99fa-ac33cc3bf9d2', N'cb31b037-4d34-42f4-b014-cf3e23d9013d', CAST(N'2026-07-06T13:34:15.8959138' AS DateTime2), CAST(N'2026-06-06T13:35:29.9255486' AS DateTime2), CAST(N'2026-06-06T13:34:15.8962678' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'33982f3e-de87-4bca-8f9a-39c281de0cd9', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'c35b6807-01cb-4a00-afcb-b1193a9242e0', CAST(N'2026-06-28T07:10:39.2520002' AS DateTime2), CAST(N'2026-05-29T07:10:42.2963646' AS DateTime2), CAST(N'2026-05-29T07:10:39.2520726' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'189c9f0d-e824-425e-9cb3-3d1ea922bdbb', N'11000000-0000-0000-0000-000000000001', N'776a919a-7277-4fac-9bd5-a814f9586165', CAST(N'2026-06-26T15:26:10.2622531' AS DateTime2), CAST(N'2026-05-28T00:56:14.0044022' AS DateTime2), CAST(N'2026-05-27T15:26:10.2623172' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'b6cf8204-afc3-4c32-97b2-4ff90d968ce2', N'13000000-0000-0000-0000-000000000001', N'6fed2e8d-5437-4d3b-b678-18867991b8b5', CAST(N'2026-06-30T16:39:18.2995149' AS DateTime2), CAST(N'2026-05-31T16:40:50.2685277' AS DateTime2), CAST(N'2026-05-31T16:39:18.2995963' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'286af3cf-1aec-4ed9-b3e9-52be999d3616', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'e623038c-b91a-4f64-82ad-5469c7c4601b', CAST(N'2026-07-17T17:42:59.4649223' AS DateTime2), NULL, CAST(N'2026-06-17T17:42:59.4649241' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'77c1c51c-62a1-47ca-8bf6-57d90d45e9f2', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'2435a336-9961-4685-98ed-3c9325979e77', CAST(N'2026-06-28T15:57:56.8509741' AS DateTime2), NULL, CAST(N'2026-05-29T15:57:56.8510827' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'914ab2c5-8ea1-4fe0-8944-58aed1342ad4', N'13000000-0000-0000-0000-000000000001', N'e4ecae85-a161-49f5-84dd-c68b00115ac5', CAST(N'2026-07-19T16:40:11.0878966' AS DateTime2), CAST(N'2026-06-19T16:44:26.7434036' AS DateTime2), CAST(N'2026-06-19T16:40:11.0878999' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'4a716f24-8c8d-474a-80d5-58de02474f56', N'b76004c8-b5f4-425a-8099-c449ea122fff', N'54811d88-27bb-419f-8247-9577e3073d2a', CAST(N'2026-07-06T15:30:23.7330118' AS DateTime2), CAST(N'2026-06-06T15:37:51.5450911' AS DateTime2), CAST(N'2026-06-06T15:30:23.7330133' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'5b42b566-45b8-4814-a8bb-5b1d7848d97e', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'1f906888-a1aa-4bdf-a9ee-ca0d85f28e86', CAST(N'2026-06-28T09:39:33.4182256' AS DateTime2), CAST(N'2026-05-29T09:45:12.8015762' AS DateTime2), CAST(N'2026-05-29T09:39:33.4183325' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'b7821a4b-5898-4aef-a1bf-5d4421de23f9', N'13000000-0000-0000-0000-000000000001', N'1696669d-9a8f-4440-b002-0042d4f901dd', CAST(N'2026-07-19T14:43:51.9102208' AS DateTime2), CAST(N'2026-06-19T15:03:17.7231813' AS DateTime2), CAST(N'2026-06-19T14:43:51.9102226' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'b64c6fa0-619a-42f1-af33-66b3456ddd6d', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'6b3319e9-050b-4a60-879b-69cec024feaf', CAST(N'2026-07-17T17:42:31.6423603' AS DateTime2), NULL, CAST(N'2026-06-17T17:42:31.6423620' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'77137cc5-55d2-46b9-907b-66c1b790979a', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'd3efb5b7-3cd7-45ed-823a-8292551b0183', CAST(N'2026-06-28T09:55:56.9530063' AS DateTime2), CAST(N'2026-05-29T10:12:28.3556724' AS DateTime2), CAST(N'2026-05-29T09:55:56.9531046' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'571b2177-658a-475b-9a72-689bf458e024', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'8c91850a-5025-486b-ac13-f36dc26166d9', CAST(N'2026-07-19T19:10:41.7914454' AS DateTime2), CAST(N'2026-06-19T19:11:29.9871653' AS DateTime2), CAST(N'2026-06-19T19:10:41.7914786' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'a5a3e9a3-801c-4fa1-b5f7-68d9e71d779e', N'11000000-0000-0000-0000-000000000001', N'af6c55ae-6ab1-4060-8bab-cd41d89f636d', CAST(N'2026-06-26T15:00:09.1620011' AS DateTime2), CAST(N'2026-05-27T15:19:58.5847121' AS DateTime2), CAST(N'2026-05-27T15:00:09.1620725' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'0ad59e7c-ce11-466f-9e5e-6a27eadadf91', N'13000000-0000-0000-0000-000000000001', N'3648a1dc-b673-44ec-ae70-909abd2c3e33', CAST(N'2026-07-19T14:37:34.1567450' AS DateTime2), CAST(N'2026-06-19T14:40:40.8378942' AS DateTime2), CAST(N'2026-06-19T14:37:34.1568349' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'c08134bd-2d81-4544-afee-6ce6ca2ebd07', N'11000000-0000-0000-0000-000000000001', N'b13b9d3d-0997-4505-8442-76ce900bd31f', CAST(N'2026-06-27T00:56:22.2472609' AS DateTime2), CAST(N'2026-05-28T01:15:41.7197925' AS DateTime2), CAST(N'2026-05-28T00:56:22.2473661' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'16406f48-b579-48ac-8570-6ceec7356b0f', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'dedbda0b-9d21-47f2-afad-531a5bd8a072', CAST(N'2026-06-25T12:13:57.8563323' AS DateTime2), CAST(N'2026-05-26T12:14:28.0491002' AS DateTime2), CAST(N'2026-05-26T12:13:57.8563346' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'65a7111d-2d48-43c1-8149-6e275e60b825', N'09d0d8af-00e3-47da-93fc-2beac9ac4c33', N'82d83c62-9ecc-4c04-9795-3d1264999494', CAST(N'2026-06-25T09:53:22.6728267' AS DateTime2), NULL, CAST(N'2026-05-26T09:53:22.6731587' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'13ff8109-b7b9-4f44-bdef-73f64e5293d3', N'11000000-0000-0000-0000-000000000001', N'4ca2c656-a90c-48cd-9f48-b4713bab1667', CAST(N'2026-06-27T07:51:38.3521186' AS DateTime2), CAST(N'2026-05-28T07:51:46.3807184' AS DateTime2), CAST(N'2026-05-28T07:51:38.3521887' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'86a32d32-5500-49a5-b1ff-7a96b6af317a', N'13000000-0000-0000-0000-000000000001', N'41c3ef2d-289b-426d-bf39-b226d1a898e1', CAST(N'2026-06-30T13:11:29.5978712' AS DateTime2), CAST(N'2026-05-31T14:17:48.9838566' AS DateTime2), CAST(N'2026-05-31T13:11:29.5978929' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'19f8f494-dc58-41d6-a335-7ad61a1470cf', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'8cac3ddb-983a-47e4-89cd-07ed219f5b4a', CAST(N'2026-07-17T17:33:22.4511536' AS DateTime2), NULL, CAST(N'2026-06-17T17:33:22.4511555' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'08951813-8575-4ede-97b0-7d98cc4db7bc', N'13000000-0000-0000-0000-000000000001', N'a36b99a9-ce64-42cf-bca2-15f42503f17b', CAST(N'2026-07-19T16:08:37.8988107' AS DateTime2), CAST(N'2026-06-19T16:28:26.9227631' AS DateTime2), CAST(N'2026-06-19T16:08:37.8988127' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'20f816ba-0cb2-47c3-8734-7dcb8dbae13d', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'eddf7142-2f44-4863-87a2-57664522f7ea', CAST(N'2026-06-28T03:05:14.6902922' AS DateTime2), CAST(N'2026-05-29T03:05:16.6080325' AS DateTime2), CAST(N'2026-05-29T03:05:14.6903953' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'080590a5-f153-46d4-a285-80171e9c315d', N'11000000-0000-0000-0000-000000000001', N'87fc2c69-7452-4af5-883b-b4704ea20de7', CAST(N'2026-06-26T14:53:45.5003021' AS DateTime2), CAST(N'2026-05-27T15:00:01.3989553' AS DateTime2), CAST(N'2026-05-27T14:53:45.5003978' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'6247c41f-f208-413e-a724-81a1ed2a2d27', N'11000000-0000-0000-0000-000000000001', N'5194645a-7406-43c2-9b2e-190dcc5ba1f8', CAST(N'2026-07-19T18:26:35.4016545' AS DateTime2), NULL, CAST(N'2026-06-19T18:26:35.4019717' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'9401318e-ac66-4ef7-8fa5-8570934744f6', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'db7ff6dd-e18f-4d68-ba14-a5221897a492', CAST(N'2026-07-19T17:34:45.5837731' AS DateTime2), NULL, CAST(N'2026-06-19T17:34:45.5837756' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'99810f7a-5823-465d-ada6-85f0251a41d9', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'738eaa82-ba04-4a2a-96fd-0e8642ac4e8f', CAST(N'2026-06-28T16:22:58.0229489' AS DateTime2), CAST(N'2026-05-30T06:02:28.9701736' AS DateTime2), CAST(N'2026-05-29T16:22:58.0235302' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'5d12934d-6690-476e-bc22-86b4c0aac50b', N'13000000-0000-0000-0000-000000000001', N'aba3cb4e-eaf9-4995-a953-3dd65b2a2c84', CAST(N'2026-07-19T14:41:10.2791005' AS DateTime2), CAST(N'2026-06-19T14:42:16.1369578' AS DateTime2), CAST(N'2026-06-19T14:41:10.2791028' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'6420675b-ab4c-472e-b64c-8727d5f59af3', N'13000000-0000-0000-0000-000000000001', N'c495800e-c63e-4068-9de7-5019db692c4b', CAST(N'2026-06-30T14:36:28.2123971' AS DateTime2), CAST(N'2026-05-31T14:36:51.8381771' AS DateTime2), CAST(N'2026-05-31T14:36:28.2124303' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'7d7f22d6-da2f-4d40-b34d-8b7cdf2d6da2', N'11000000-0000-0000-0000-000000000001', N'f28fa8e5-04dd-4ce6-b996-b54a70560d7c', CAST(N'2026-07-19T17:57:56.2292968' AS DateTime2), CAST(N'2026-06-19T18:25:19.4488099' AS DateTime2), CAST(N'2026-06-19T17:57:56.2292989' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'5941e361-8f2b-4169-9016-8d0674a24d5f', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'19f0e1f6-c2d0-4786-b9ec-fda1073a0741', CAST(N'2026-07-19T17:23:26.2685269' AS DateTime2), CAST(N'2026-06-19T17:34:38.4737556' AS DateTime2), CAST(N'2026-06-19T17:23:26.2686243' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'383421eb-888c-47bf-aa81-911eea00ebcd', N'11000000-0000-0000-0000-000000000001', N'27b8bdff-a35c-4576-9e9c-de7cfdd5d8dc', CAST(N'2026-06-29T13:50:19.6668319' AS DateTime2), CAST(N'2026-05-30T14:01:45.8930959' AS DateTime2), CAST(N'2026-05-30T13:50:19.6673642' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'e39adb00-9f25-47db-9992-9122a922d618', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'b1358d7d-03bb-4a37-807f-28c1d6d756b3', CAST(N'2026-07-17T15:18:03.8514633' AS DateTime2), CAST(N'2026-06-17T15:18:31.0741713' AS DateTime2), CAST(N'2026-06-17T15:18:03.8514839' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'19fdd669-81c3-4cb6-a578-9341223c83b0', N'13000000-0000-0000-0000-000000000001', N'c408a14d-8f4d-4c17-95a2-a48a3cb3c88b', CAST(N'2026-06-30T10:14:14.1261598' AS DateTime2), CAST(N'2026-05-31T10:18:54.6273086' AS DateTime2), CAST(N'2026-05-31T10:14:14.1262507' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'ce31c047-a00e-41f5-ae5b-98f6adc5516c', N'13000000-0000-0000-0000-000000000001', N'f5f2f18d-b3cc-4d26-bd19-a58a0175eeb8', CAST(N'2026-07-19T18:55:31.0709221' AS DateTime2), CAST(N'2026-06-19T18:55:44.4262234' AS DateTime2), CAST(N'2026-06-19T18:55:31.0709235' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'8dddea99-e5aa-4b35-8b63-9a85b01e087c', N'13000000-0000-0000-0000-000000000001', N'704dc519-0995-4673-8c89-619adfa5da8a', CAST(N'2026-07-19T17:57:30.2123663' AS DateTime2), CAST(N'2026-06-19T17:57:52.5512216' AS DateTime2), CAST(N'2026-06-19T17:57:30.2123893' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'b18fc463-4a25-4f31-9a85-9d4bd4a2ad46', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'e68a4afd-e5ed-4e1a-b204-ee7f2bef6c48', CAST(N'2026-06-25T12:13:14.3928754' AS DateTime2), CAST(N'2026-05-26T12:13:17.4620611' AS DateTime2), CAST(N'2026-05-26T12:13:14.3928802' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'7f0986da-3697-4aa0-aec8-9dd29efa3229', N'11000000-0000-0000-0000-000000000001', N'1d84ae5c-41d2-4445-8547-ef0f4a3fd7a5', CAST(N'2026-07-19T16:28:30.3675499' AS DateTime2), CAST(N'2026-06-19T16:40:07.1794199' AS DateTime2), CAST(N'2026-06-19T16:28:30.3676674' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'c6d852bf-54da-41a0-9633-a05af1db302d', N'13000000-0000-0000-0000-000000000001', N'3ec02db1-630a-4474-bd65-4d1cd6dddb60', CAST(N'2026-06-30T10:22:22.6733864' AS DateTime2), CAST(N'2026-05-31T12:52:33.4982384' AS DateTime2), CAST(N'2026-05-31T10:22:22.6734902' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'dbbf9878-fda4-4ceb-998e-a12f67cea4f3', N'74911152-5345-4c53-8160-7fbdd15436e6', N'e9525ef1-a5d4-433a-aa0b-673626f4cf06', CAST(N'2026-06-25T13:46:49.7034360' AS DateTime2), CAST(N'2026-05-26T13:50:44.4138875' AS DateTime2), CAST(N'2026-05-26T13:46:49.7041584' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'9e7c6969-e811-4027-ad04-a1a728c8bd0c', N'13000000-0000-0000-0000-000000000001', N'4bcc1524-e49b-42af-8330-23a7168fb070', CAST(N'2026-07-19T15:17:02.1826436' AS DateTime2), CAST(N'2026-06-19T15:58:19.5069544' AS DateTime2), CAST(N'2026-06-19T15:17:02.1826451' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'9540bad6-4bcf-4188-aa48-a2680195285d', N'11000000-0000-0000-0000-000000000001', N'945f9748-652a-447e-a5c1-3f5c5db0733a', CAST(N'2026-07-19T18:55:47.8085972' AS DateTime2), CAST(N'2026-06-19T19:10:35.5714491' AS DateTime2), CAST(N'2026-06-19T18:55:47.8085986' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'24aea09f-2f9e-4045-9bcb-a54d7b6599e1', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'e25f5ef5-88c9-471d-8164-be4246d30418', CAST(N'2026-07-17T15:24:38.1506461' AS DateTime2), CAST(N'2026-06-17T15:31:51.7055216' AS DateTime2), CAST(N'2026-06-17T15:24:38.1506515' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'be946172-7d8e-4f81-a06c-a650a1a65016', N'11000000-0000-0000-0000-000000000001', N'43d497c3-6f33-46d6-a3d2-b27810e958da', CAST(N'2026-06-28T07:25:20.5687011' AS DateTime2), CAST(N'2026-05-29T07:25:57.4243186' AS DateTime2), CAST(N'2026-05-29T07:25:20.5688215' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'e2d497e8-32cd-4e32-ba98-a952b5520334', N'11000000-0000-0000-0000-000000000001', N'cc59319b-09cb-4fc5-aa50-621e23ec948c', CAST(N'2026-07-06T16:36:49.4728785' AS DateTime2), CAST(N'2026-06-06T17:08:08.3566537' AS DateTime2), CAST(N'2026-06-06T16:36:49.4731240' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'2ef38279-f4f3-4e11-b2f1-abb6cabcfb21', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'f6e04b13-01e1-4389-a6a1-70a213f26d1e', CAST(N'2026-07-17T15:39:30.5689473' AS DateTime2), CAST(N'2026-06-19T02:37:45.8983878' AS DateTime2), CAST(N'2026-06-17T15:39:30.5694623' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'f1f3f739-753a-41fd-915f-ae0e60259794', N'13000000-0000-0000-0000-000000000001', N'35a0d360-a987-44a6-8938-071edc210d8f', CAST(N'2026-06-30T09:50:58.0983215' AS DateTime2), CAST(N'2026-05-31T10:14:11.3184085' AS DateTime2), CAST(N'2026-05-31T09:50:58.0983232' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'a50513ea-4a0e-40f4-8d7d-b47fb0d09dda', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'9c6d32d0-9319-4cb0-b1f9-eb1ad4cc433b', CAST(N'2026-06-30T14:37:10.3356404' AS DateTime2), CAST(N'2026-05-31T15:56:39.7687302' AS DateTime2), CAST(N'2026-05-31T14:37:10.3356426' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'8630022d-6897-40ec-afea-b489bbb48078', N'11000000-0000-0000-0000-000000000001', N'703d12d4-54ca-4ff1-93a2-32d8cd8454fd', CAST(N'2026-06-27T01:20:41.4403139' AS DateTime2), NULL, CAST(N'2026-05-28T01:20:41.4403749' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'764d8137-a698-4d0a-b78a-b739370561bb', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'8852f86a-b6e8-48b0-978c-e42595245f61', CAST(N'2026-07-19T16:07:19.0110814' AS DateTime2), NULL, CAST(N'2026-06-19T16:07:19.0111786' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'07c57224-2f25-4c08-b805-b780cf9a1c3d', N'13000000-0000-0000-0000-000000000001', N'98b14438-a603-47b6-b1bb-f184983f7c1c', CAST(N'2026-06-30T09:46:14.5518589' AS DateTime2), CAST(N'2026-05-31T09:46:58.2213744' AS DateTime2), CAST(N'2026-05-31T09:46:14.5519557' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'f0490f78-6391-45f5-a8ad-ba230afee769', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'ad3b1f6a-4259-42cd-abb2-e16ed3098d7e', CAST(N'2026-06-28T15:44:47.9909268' AS DateTime2), NULL, CAST(N'2026-05-29T15:44:47.9910148' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'6f0d48a3-22f8-4115-9fdd-be7c8ae8a9c9', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'8be9593b-4c4d-4e5e-bfc4-3634f59246dd', CAST(N'2026-07-06T15:30:10.7242967' AS DateTime2), CAST(N'2026-06-06T15:30:14.9744385' AS DateTime2), CAST(N'2026-06-06T15:30:10.7243929' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'a1c4cbd5-3f99-407d-b87f-c086bf9f188b', N'2f225ee8-8b15-46d9-99fa-ac33cc3bf9d2', N'277d3293-fa17-47c6-afd2-3b618a9d2095', CAST(N'2026-07-06T09:52:54.5279856' AS DateTime2), CAST(N'2026-06-06T10:05:58.7650767' AS DateTime2), CAST(N'2026-06-06T09:52:54.5280655' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'7f02f01e-386c-46a6-a0aa-c33a6ffd1ac2', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'81b535f6-59a6-4e97-ad95-7dbfd7f59657', CAST(N'2026-07-19T14:42:21.8672052' AS DateTime2), CAST(N'2026-06-19T14:43:12.1423760' AS DateTime2), CAST(N'2026-06-19T14:42:21.8672123' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'b42b5091-38b6-471d-b9af-c494075bdd0b', N'11000000-0000-0000-0000-000000000001', N'e05b944a-3d93-4b36-85e0-fcc114e18843', CAST(N'2026-07-19T19:11:33.9245412' AS DateTime2), NULL, CAST(N'2026-06-19T19:11:33.9245426' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'b82a4e00-7394-4563-90fc-c5771bbdbd2c', N'13000000-0000-0000-0000-000000000001', N'b84081cf-2ced-47e7-8a5b-9f5259c5cf19', CAST(N'2026-07-19T16:56:48.4211474' AS DateTime2), CAST(N'2026-06-19T17:25:02.9497893' AS DateTime2), CAST(N'2026-06-19T16:56:48.4212114' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'4eb0ddfc-7001-4ec9-8761-c83d964ba472', N'11000000-0000-0000-0000-000000000001', N'040e4425-7c68-4ec7-9e5a-37d0c1fc3e5d', CAST(N'2026-06-29T14:20:12.1011409' AS DateTime2), CAST(N'2026-05-30T14:20:47.3492373' AS DateTime2), CAST(N'2026-05-30T14:20:12.1012352' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'd11aebe3-75de-490f-b2c2-ca7b3194be9a', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'08d378d1-a61c-446c-bfed-1b4b3ce038ea', CAST(N'2026-07-19T15:03:26.2665671' AS DateTime2), CAST(N'2026-06-19T15:16:59.6959118' AS DateTime2), CAST(N'2026-06-19T15:03:26.2665931' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'8df36f44-38ff-45aa-889f-cacded65d699', N'11000000-0000-0000-0000-000000000001', N'0278e02e-5261-4109-8e57-aaa450832aeb', CAST(N'2026-07-19T17:46:18.6471985' AS DateTime2), CAST(N'2026-06-19T17:57:25.4018523' AS DateTime2), CAST(N'2026-06-19T17:46:18.6472015' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'6c3b6163-8bf3-4123-80a3-cd9edd6d71c0', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'4a2c7464-b61c-4bb5-adfd-892fab4a084f', CAST(N'2026-06-30T14:17:54.3592582' AS DateTime2), CAST(N'2026-05-31T14:36:25.3521084' AS DateTime2), CAST(N'2026-05-31T14:17:54.3593041' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'82a586e6-4211-4bf2-bafc-d1f13ad1d786', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'4fbbf095-44cf-4c32-81db-d07ae7dec56e', CAST(N'2026-07-19T02:37:54.4707404' AS DateTime2), CAST(N'2026-06-19T14:37:31.0721510' AS DateTime2), CAST(N'2026-06-19T02:37:54.4707766' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'e3b0c4a9-9a68-49d6-abd8-d2f537cc8ef0', N'11000000-0000-0000-0000-000000000001', N'c8214a04-2735-4017-9fd4-499b6b160dfb', CAST(N'2026-07-19T18:53:58.6880988' AS DateTime2), CAST(N'2026-06-19T18:55:28.4155744' AS DateTime2), CAST(N'2026-06-19T18:53:58.6881230' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'e1cd4c7e-c6cf-4fd9-9076-d4e6a47230ff', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'ab7546f4-5d5f-4004-bfb9-5692699344f9', CAST(N'2026-06-29T11:54:50.4406863' AS DateTime2), CAST(N'2026-05-30T13:50:07.4818566' AS DateTime2), CAST(N'2026-05-30T11:54:50.4406892' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'799aaeb2-6dbd-48e2-8229-d5913ef5d645', N'11000000-0000-0000-0000-000000000001', N'175a7395-4525-4656-b100-0ab9c79a05fa', CAST(N'2026-06-28T08:02:10.7741040' AS DateTime2), CAST(N'2026-05-29T08:02:20.9692458' AS DateTime2), CAST(N'2026-05-29T08:02:10.7741859' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'ca95cc1f-cc55-4511-a53a-d74c7a6e4161', N'13000000-0000-0000-0000-000000000001', N'b37fb509-eed2-444d-a1a5-0740a78f01e5', CAST(N'2026-06-30T14:36:53.2027117' AS DateTime2), CAST(N'2026-05-31T14:36:54.8411453' AS DateTime2), CAST(N'2026-05-31T14:36:53.2027136' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'777602a5-2101-46b0-9368-d7bb04a6dbae', N'13000000-0000-0000-0000-000000000001', N'de126596-4710-4d10-b0c4-c90bbd5c933b', CAST(N'2026-07-19T17:38:11.2906482' AS DateTime2), CAST(N'2026-06-19T17:46:15.0334696' AS DateTime2), CAST(N'2026-06-19T17:38:11.2907374' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'491c604c-d2e2-4ba8-8725-df8a8d57bb88', N'11000000-0000-0000-0000-000000000001', N'64950c51-10a2-4964-a3c9-eefa2ce3f092', CAST(N'2026-06-25T12:11:49.1160043' AS DateTime2), CAST(N'2026-05-26T12:13:07.2524241' AS DateTime2), CAST(N'2026-05-26T12:11:49.1160678' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'06dd5da4-ff5a-4ab0-a361-e04279dc51cb', N'74911152-5345-4c53-8160-7fbdd15436e6', N'ca4f25f2-6c8b-4ef5-a827-1c71bbc260db', CAST(N'2026-07-20T04:37:09.5946548' AS DateTime2), NULL, CAST(N'2026-06-20T04:37:09.5948322' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'e4908b75-e00f-408f-b0c7-e4c5f7915bea', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'bfe6d1c3-dba9-442b-b0f3-49d5c75717c1', CAST(N'2026-06-29T14:20:53.9072132' AS DateTime2), CAST(N'2026-05-31T08:29:57.1137662' AS DateTime2), CAST(N'2026-05-30T14:20:53.9072146' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'9153bb7e-ef8e-498a-a3ba-e78412cb8c7e', N'13000000-0000-0000-0000-000000000001', N'f8a5d767-a213-4cf3-8518-457962d8bdd2', CAST(N'2026-07-19T16:44:30.1343882' AS DateTime2), CAST(N'2026-06-19T16:56:46.1512777' AS DateTime2), CAST(N'2026-06-19T16:44:30.1343908' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'52e5de98-5285-48c6-a28b-e9a7a2f8a411', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'a7065469-ea1f-49bb-b87d-f5d874e1dd90', CAST(N'2026-06-28T09:45:19.0871836' AS DateTime2), CAST(N'2026-05-29T09:55:46.9266363' AS DateTime2), CAST(N'2026-05-29T09:45:19.0872958' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'00e23605-0445-4c8d-8d24-eacb08d1f5d2', N'b76004c8-b5f4-425a-8099-c449ea122fff', N'358e60fd-3821-4e4e-9868-b8b2f8328cd9', CAST(N'2026-07-06T15:38:14.7959554' AS DateTime2), CAST(N'2026-06-06T15:59:43.6051973' AS DateTime2), CAST(N'2026-06-06T15:38:14.7959566' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'8b43bb28-30f6-418e-8885-eb576142c5d9', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'650b4d9e-61df-450c-b263-7ebed3b0c8d4', CAST(N'2026-06-29T06:02:47.8782799' AS DateTime2), CAST(N'2026-05-30T09:21:46.4396953' AS DateTime2), CAST(N'2026-05-30T06:02:47.8783583' AS DateTime2))
GO
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'15678542-4c4e-4487-9b13-ed49776479d4', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'caa5164d-9f04-4211-8ee7-7d955e679507', CAST(N'2026-07-17T17:33:02.2248601' AS DateTime2), NULL, CAST(N'2026-06-17T17:33:02.2248623' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'673211f2-6b60-4bb1-b247-edbfb6484696', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'1659c6a8-2e29-42ef-82d4-98d9a6bd8635', CAST(N'2026-07-19T14:40:49.1893148' AS DateTime2), CAST(N'2026-06-19T14:41:08.6571214' AS DateTime2), CAST(N'2026-06-19T14:40:49.1893627' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'af1d94f7-99aa-456c-8b6d-ee2890e70ad0', N'13000000-0000-0000-0000-000000000001', N'48ad02de-f881-4253-8e5f-216e23bafdb9', CAST(N'2026-07-06T17:08:13.0946814' AS DateTime2), NULL, CAST(N'2026-06-06T17:08:13.0948056' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'28658bdc-c10e-483e-b05d-ee3bee09ed78', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'fe5c4f24-410e-4b06-838b-6e85afd289f3', CAST(N'2026-06-28T10:12:35.6535273' AS DateTime2), CAST(N'2026-05-29T15:44:27.9969004' AS DateTime2), CAST(N'2026-05-29T10:12:35.6536152' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'0fab179f-2779-4bb1-8390-f0cd3c3ee486', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'39639ea5-4e0d-41ae-b88b-38e6b7f1f96b', CAST(N'2026-06-30T16:40:57.1450118' AS DateTime2), CAST(N'2026-05-31T16:43:06.7227590' AS DateTime2), CAST(N'2026-05-31T16:40:57.1450140' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'86b2acb5-31a2-4cd0-9544-f25c3b8d399a', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'e180ebf4-d1da-40d4-95cb-e3ba0092f946', CAST(N'2026-07-06T13:35:37.0122229' AS DateTime2), CAST(N'2026-06-06T15:15:24.4031126' AS DateTime2), CAST(N'2026-06-06T13:35:37.0122251' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'58857a22-b8b0-4487-a4fd-f6f5b4655b9d', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'fdeebc97-0e2c-4189-96b0-5ab6f1adc188', CAST(N'2026-06-29T11:51:02.6508476' AS DateTime2), CAST(N'2026-05-30T11:51:47.7494283' AS DateTime2), CAST(N'2026-05-30T11:51:02.6509387' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'bbc14053-c08e-4792-b884-f75655c8279a', N'd4431c38-fa4c-47b3-9a72-e57fabc3e0a1', N'f41fdf70-9a18-4889-9ea7-8da40fd56fa4', CAST(N'2026-07-19T15:58:25.3276617' AS DateTime2), CAST(N'2026-06-19T16:08:34.5061297' AS DateTime2), CAST(N'2026-06-19T15:58:25.3277708' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'35a09f82-2b16-48fc-8dfc-f9057fdc397a', N'11000000-0000-0000-0000-000000000001', N'677ed262-5e48-49ab-bad8-702f7dbcc774', CAST(N'2026-07-06T10:06:04.6840855' AS DateTime2), CAST(N'2026-06-06T13:28:46.0025452' AS DateTime2), CAST(N'2026-06-06T10:06:04.6840877' AS DateTime2))
INSERT [dbo].[UserSessions] ([Id], [UserId], [RefreshTokenHash], [ExpiresAt], [RevokedAt], [CreatedAt]) VALUES (N'd7844ebf-0fb7-4c14-9da3-fe489c20a6ad', N'ffe1fdb2-7aa8-4b80-9695-dd578494294b', N'a97256ff-333e-461c-a0e0-2b349b013aa5', CAST(N'2026-07-17T17:39:20.1001765' AS DateTime2), NULL, CAST(N'2026-06-17T17:39:20.1001783' AS DateTime2))
GO
INSERT [dbo].[WalletTransactions] ([Id], [StoreWalletId], [Amount], [Type], [Status], [OrderId], [ReferenceId], [Description], [CreatedAt]) VALUES (N'b101d8ab-2d2c-4a71-ad3c-856c2405af48', N'33e82ab0-a206-4000-a69c-3ce808afb32b', CAST(1800.00 AS Decimal(18, 2)), 2, 1, N'78d917d3-cfe1-497c-aeb0-782e333a29d1', NULL, N'Phí n?n t?ng (5%) t? don hàng 1781890727017', CAST(N'2026-06-19T18:59:43.5233333' AS DateTime2))
INSERT [dbo].[WalletTransactions] ([Id], [StoreWalletId], [Amount], [Type], [Status], [OrderId], [ReferenceId], [Description], [CreatedAt]) VALUES (N'2dc82ec6-6f57-4cf1-a826-8b9a1a298d2f', N'33e82ab0-a206-4000-a69c-3ce808afb32b', CAST(36000.00 AS Decimal(18, 2)), 1, 1, N'78d917d3-cfe1-497c-aeb0-782e333a29d1', NULL, N'Doanh thu từ đơn hàng 1781890727017', CAST(N'2026-06-19T17:41:27.5700000' AS DateTime2))
GO
/****** Object:  Index [UQ_Carts_UserId]    Script Date: 6/20/2026 4:42:46 PM ******/
ALTER TABLE [dbo].[Carts] ADD  CONSTRAINT [UQ_Carts_UserId] UNIQUE NONCLUSTERED 
(
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_CustomerWallets_UserId]    Script Date: 6/20/2026 4:42:46 PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [UQ_CustomerWallets_UserId] ON [dbo].[CustomerWallets]
(
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CustomerWalletTransactions_OrderId]    Script Date: 6/20/2026 4:42:46 PM ******/
CREATE NONCLUSTERED INDEX [IX_CustomerWalletTransactions_OrderId] ON [dbo].[CustomerWalletTransactions]
(
	[OrderId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_CustomerWalletTransactions_WalletId]    Script Date: 6/20/2026 4:42:46 PM ******/
CREATE NONCLUSTERED INDEX [IX_CustomerWalletTransactions_WalletId] ON [dbo].[CustomerWalletTransactions]
(
	[CustomerWalletId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_Payments_OrderId]    Script Date: 6/20/2026 4:42:46 PM ******/
ALTER TABLE [dbo].[Payments] ADD  CONSTRAINT [UQ_Payments_OrderId] UNIQUE NONCLUSTERED 
(
	[OrderId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_ReviewImages_ReviewId]    Script Date: 6/20/2026 4:42:46 PM ******/
CREATE NONCLUSTERED INDEX [IX_ReviewImages_ReviewId] ON [dbo].[ReviewImages]
(
	[ReviewId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_Reviews_OrderItemId]    Script Date: 6/20/2026 4:42:46 PM ******/
ALTER TABLE [dbo].[Reviews] ADD  CONSTRAINT [UQ_Reviews_OrderItemId] UNIQUE NONCLUSTERED 
(
	[OrderItemId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Roles_Code]    Script Date: 6/20/2026 4:42:46 PM ******/
ALTER TABLE [dbo].[Roles] ADD  CONSTRAINT [UQ_Roles_Code] UNIQUE NONCLUSTERED 
(
	[Code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_StoreStaffs_Store_User]    Script Date: 6/20/2026 4:42:46 PM ******/
ALTER TABLE [dbo].[StoreStaffs] ADD  CONSTRAINT [UQ_StoreStaffs_Store_User] UNIQUE NONCLUSTERED 
(
	[StoreId] ASC,
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_StoreSubscriptions_UserId]    Script Date: 6/20/2026 4:42:46 PM ******/
CREATE NONCLUSTERED INDEX [IX_StoreSubscriptions_UserId] ON [dbo].[StoreSubscriptions]
(
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ__StoreWal__3B82F100E99E60F3]    Script Date: 6/20/2026 4:42:46 PM ******/
ALTER TABLE [dbo].[StoreWallets] ADD UNIQUE NONCLUSTERED 
(
	[StoreId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_StoreWallets_StoreId]    Script Date: 6/20/2026 4:42:46 PM ******/
CREATE NONCLUSTERED INDEX [IX_StoreWallets_StoreId] ON [dbo].[StoreWallets]
(
	[StoreId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_UserRoles_User_Role]    Script Date: 6/20/2026 4:42:46 PM ******/
ALTER TABLE [dbo].[UserRoles] ADD  CONSTRAINT [UQ_UserRoles_User_Role] UNIQUE NONCLUSTERED 
(
	[UserId] ASC,
	[RoleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_Users_Email]    Script Date: 6/20/2026 4:42:46 PM ******/
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [UQ_Users_Email] UNIQUE NONCLUSTERED 
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_WalletTransactions_OrderId]    Script Date: 6/20/2026 4:42:46 PM ******/
CREATE NONCLUSTERED INDEX [IX_WalletTransactions_OrderId] ON [dbo].[WalletTransactions]
(
	[OrderId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_WalletTransactions_StoreWalletId]    Script Date: 6/20/2026 4:42:46 PM ******/
CREATE NONCLUSTERED INDEX [IX_WalletTransactions_StoreWalletId] ON [dbo].[WalletTransactions]
(
	[StoreWalletId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_WithdrawalRequests_StoreId]    Script Date: 6/20/2026 4:42:46 PM ******/
CREATE NONCLUSTERED INDEX [IX_WithdrawalRequests_StoreId] ON [dbo].[WithdrawalRequests]
(
	[StoreId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_WithdrawalRequests_UserId]    Script Date: 6/20/2026 4:42:46 PM ******/
CREATE NONCLUSTERED INDEX [IX_WithdrawalRequests_UserId] ON [dbo].[WithdrawalRequests]
(
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[CartItems] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[Carts] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[Categories] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[Categories] ADD  CONSTRAINT [DF_Categories_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Categories] ADD  CONSTRAINT [DF_Categories_IsDeleted]  DEFAULT ((0)) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[ClearanceListings] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[ClearanceListings] ADD  CONSTRAINT [DF_ClearanceListings_Status]  DEFAULT ((0)) FOR [Status]
GO
ALTER TABLE [dbo].[ClearanceListings] ADD  CONSTRAINT [DF_ClearanceListings_Flags]  DEFAULT ((0)) FOR [ListingFlags]
GO
ALTER TABLE [dbo].[ClearanceListings] ADD  CONSTRAINT [DF_ClearanceListings_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[CustomerWallets] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[CustomerWallets] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[CustomerWallets] ADD  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[CustomerWalletTransactions] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[CustomerWalletTransactions] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[EmailVerifications] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[EmailVerifications] ADD  CONSTRAINT [DF_EmailVerifications_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[ListingDiscountRules] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[ListingDiscountRules] ADD  CONSTRAINT [DF_ListingDiscountRules_Flags]  DEFAULT ((1)) FOR [RuleFlags]
GO
ALTER TABLE [dbo].[ListingDiscountRules] ADD  CONSTRAINT [DF_ListingDiscountRules_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[ListingImages] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[ListingImages] ADD  CONSTRAINT [DF_ListingImages_Flags]  DEFAULT ((0)) FOR [ImageFlags]
GO
ALTER TABLE [dbo].[OrderItems] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[Orders] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[Orders] ADD  CONSTRAINT [DF_Orders_Status]  DEFAULT ((0)) FOR [OrderStatus]
GO
ALTER TABLE [dbo].[Orders] ADD  CONSTRAINT [DF_Orders_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Orders] ADD  DEFAULT (CONVERT([bit],(0))) FOR [AgreedToNoRefundPolicy]
GO
ALTER TABLE [dbo].[PasswordResetTokens] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[PasswordResetTokens] ADD  CONSTRAINT [DF_PasswordResetTokens_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Payments] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[Payments] ADD  CONSTRAINT [DF_Payments_Status]  DEFAULT ((0)) FOR [Status]
GO
ALTER TABLE [dbo].[Payments] ADD  CONSTRAINT [DF_Payments_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[ProductImages] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[ProductImages] ADD  CONSTRAINT [DF_ProductImages_Flags]  DEFAULT ((0)) FOR [ImageFlags]
GO
ALTER TABLE [dbo].[Products] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[Products] ADD  CONSTRAINT [DF_Products_Flags]  DEFAULT ((0)) FOR [ProductFlags]
GO
ALTER TABLE [dbo].[Products] ADD  CONSTRAINT [DF_Products_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[ReviewImages] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[ReviewImages] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Reviews] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[Reviews] ADD  CONSTRAINT [DF_Reviews_Flags]  DEFAULT ((0)) FOR [ReviewFlags]
GO
ALTER TABLE [dbo].[Reviews] ADD  CONSTRAINT [DF_Reviews_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Roles] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[Stores] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[Stores] ADD  DEFAULT (N'') FOR [Ward]
GO
ALTER TABLE [dbo].[Stores] ADD  CONSTRAINT [DF_Stores_Status]  DEFAULT ((0)) FOR [Status]
GO
ALTER TABLE [dbo].[Stores] ADD  CONSTRAINT [DF_Stores_Flags]  DEFAULT ((0)) FOR [StoreFlags]
GO
ALTER TABLE [dbo].[Stores] ADD  CONSTRAINT [DF_Stores_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Stores] ADD  DEFAULT ((100)) FOR [TrustScore]
GO
ALTER TABLE [dbo].[StoreStaffs] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[StoreStaffs] ADD  CONSTRAINT [DF_StoreStaffs_Flags]  DEFAULT ((1)) FOR [StaffFlags]
GO
ALTER TABLE [dbo].[StoreStaffs] ADD  CONSTRAINT [DF_StoreStaffs_JoinedAt]  DEFAULT (sysutcdatetime()) FOR [JoinedAt]
GO
ALTER TABLE [dbo].[StoreSubscriptions] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[StoreSubscriptions] ADD  CONSTRAINT [DF_StoreSubscriptions_Status]  DEFAULT ((0)) FOR [Status]
GO
ALTER TABLE [dbo].[StoreSubscriptions] ADD  CONSTRAINT [DF_StoreSubscriptions_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[StoreWallets] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[StoreWallets] ADD  DEFAULT ((0)) FOR [AvailableBalance]
GO
ALTER TABLE [dbo].[StoreWallets] ADD  DEFAULT ((0)) FOR [PendingBalance]
GO
ALTER TABLE [dbo].[StoreWallets] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[StoreWallets] ADD  DEFAULT (getutcdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[SubscriptionPlans] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[SubscriptionPlans] ADD  CONSTRAINT [DF_SubscriptionPlans_Flags]  DEFAULT ((1)) FOR [PlanFlags]
GO
ALTER TABLE [dbo].[SubscriptionPlans] ADD  DEFAULT (CONVERT([bit],(0))) FOR [HasCustomBanner]
GO
ALTER TABLE [dbo].[SubscriptionPlans] ADD  DEFAULT (CONVERT([bit],(0))) FOR [HasFeaturedBadge]
GO
ALTER TABLE [dbo].[SubscriptionPlans] ADD  DEFAULT ((0)) FOR [PriorityLevel]
GO
ALTER TABLE [dbo].[SubscriptionPlans] ADD  DEFAULT ((0)) FOR [AnalyticsLevel]
GO
ALTER TABLE [dbo].[UserRoles] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[Users] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_Status]  DEFAULT ((0)) FOR [Status]
GO
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_Flags]  DEFAULT ((0)) FOR [UserFlags]
GO
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[UserSessions] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[UserSessions] ADD  CONSTRAINT [DF_UserSessions_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[WalletTransactions] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[WalletTransactions] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[WithdrawalRequests] ADD  DEFAULT (newid()) FOR [Id]
GO
ALTER TABLE [dbo].[WithdrawalRequests] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[CartItems]  WITH CHECK ADD  CONSTRAINT [FK_CartItems_Carts] FOREIGN KEY([CartId])
REFERENCES [dbo].[Carts] ([Id])
GO
ALTER TABLE [dbo].[CartItems] CHECK CONSTRAINT [FK_CartItems_Carts]
GO
ALTER TABLE [dbo].[CartItems]  WITH CHECK ADD  CONSTRAINT [FK_CartItems_Listings] FOREIGN KEY([ListingId])
REFERENCES [dbo].[ClearanceListings] ([Id])
GO
ALTER TABLE [dbo].[CartItems] CHECK CONSTRAINT [FK_CartItems_Listings]
GO
ALTER TABLE [dbo].[Carts]  WITH CHECK ADD  CONSTRAINT [FK_Carts_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([Id])
GO
ALTER TABLE [dbo].[Carts] CHECK CONSTRAINT [FK_Carts_Users]
GO
ALTER TABLE [dbo].[ClearanceListings]  WITH CHECK ADD  CONSTRAINT [FK_ClearanceListings_Products] FOREIGN KEY([ProductId])
REFERENCES [dbo].[Products] ([Id])
GO
ALTER TABLE [dbo].[ClearanceListings] CHECK CONSTRAINT [FK_ClearanceListings_Products]
GO
ALTER TABLE [dbo].[CustomerWallets]  WITH CHECK ADD  CONSTRAINT [FK_CustomerWallets_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[CustomerWallets] CHECK CONSTRAINT [FK_CustomerWallets_Users]
GO
ALTER TABLE [dbo].[CustomerWalletTransactions]  WITH CHECK ADD  CONSTRAINT [FK_CustomerWalletTransactions_Orders] FOREIGN KEY([OrderId])
REFERENCES [dbo].[Orders] ([Id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[CustomerWalletTransactions] CHECK CONSTRAINT [FK_CustomerWalletTransactions_Orders]
GO
ALTER TABLE [dbo].[CustomerWalletTransactions]  WITH CHECK ADD  CONSTRAINT [FK_CustomerWalletTransactions_Wallets] FOREIGN KEY([CustomerWalletId])
REFERENCES [dbo].[CustomerWallets] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[CustomerWalletTransactions] CHECK CONSTRAINT [FK_CustomerWalletTransactions_Wallets]
GO
ALTER TABLE [dbo].[EmailVerifications]  WITH CHECK ADD  CONSTRAINT [FK_EmailVerifications_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([Id])
GO
ALTER TABLE [dbo].[EmailVerifications] CHECK CONSTRAINT [FK_EmailVerifications_Users]
GO
ALTER TABLE [dbo].[ListingDiscountRules]  WITH CHECK ADD  CONSTRAINT [FK_ListingDiscountRules_Listings] FOREIGN KEY([ListingId])
REFERENCES [dbo].[ClearanceListings] ([Id])
GO
ALTER TABLE [dbo].[ListingDiscountRules] CHECK CONSTRAINT [FK_ListingDiscountRules_Listings]
GO
ALTER TABLE [dbo].[ListingImages]  WITH CHECK ADD  CONSTRAINT [FK_ListingImages_Listings] FOREIGN KEY([ListingId])
REFERENCES [dbo].[ClearanceListings] ([Id])
GO
ALTER TABLE [dbo].[ListingImages] CHECK CONSTRAINT [FK_ListingImages_Listings]
GO
ALTER TABLE [dbo].[OrderItems]  WITH CHECK ADD  CONSTRAINT [FK_OrderItems_Listings] FOREIGN KEY([ListingId])
REFERENCES [dbo].[ClearanceListings] ([Id])
GO
ALTER TABLE [dbo].[OrderItems] CHECK CONSTRAINT [FK_OrderItems_Listings]
GO
ALTER TABLE [dbo].[OrderItems]  WITH CHECK ADD  CONSTRAINT [FK_OrderItems_Orders] FOREIGN KEY([OrderId])
REFERENCES [dbo].[Orders] ([Id])
GO
ALTER TABLE [dbo].[OrderItems] CHECK CONSTRAINT [FK_OrderItems_Orders]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_ConfirmedBy] FOREIGN KEY([ConfirmedById])
REFERENCES [dbo].[Users] ([Id])
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [FK_Orders_ConfirmedBy]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_Stores] FOREIGN KEY([StoreId])
REFERENCES [dbo].[Stores] ([Id])
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [FK_Orders_Stores]
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD  CONSTRAINT [FK_Orders_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([Id])
GO
ALTER TABLE [dbo].[Orders] CHECK CONSTRAINT [FK_Orders_Users]
GO
ALTER TABLE [dbo].[PasswordResetTokens]  WITH CHECK ADD  CONSTRAINT [FK_PasswordResetTokens_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([Id])
GO
ALTER TABLE [dbo].[PasswordResetTokens] CHECK CONSTRAINT [FK_PasswordResetTokens_Users]
GO
ALTER TABLE [dbo].[Payments]  WITH CHECK ADD  CONSTRAINT [FK_Payments_Orders] FOREIGN KEY([OrderId])
REFERENCES [dbo].[Orders] ([Id])
GO
ALTER TABLE [dbo].[Payments] CHECK CONSTRAINT [FK_Payments_Orders]
GO
ALTER TABLE [dbo].[ProductImages]  WITH CHECK ADD  CONSTRAINT [FK_ProductImages_Products] FOREIGN KEY([ProductId])
REFERENCES [dbo].[Products] ([Id])
GO
ALTER TABLE [dbo].[ProductImages] CHECK CONSTRAINT [FK_ProductImages_Products]
GO
ALTER TABLE [dbo].[Products]  WITH CHECK ADD  CONSTRAINT [FK_Products_Categories] FOREIGN KEY([CategoryId])
REFERENCES [dbo].[Categories] ([Id])
GO
ALTER TABLE [dbo].[Products] CHECK CONSTRAINT [FK_Products_Categories]
GO
ALTER TABLE [dbo].[Products]  WITH CHECK ADD  CONSTRAINT [FK_Products_Stores] FOREIGN KEY([StoreId])
REFERENCES [dbo].[Stores] ([Id])
GO
ALTER TABLE [dbo].[Products] CHECK CONSTRAINT [FK_Products_Stores]
GO
ALTER TABLE [dbo].[ReviewImages]  WITH CHECK ADD  CONSTRAINT [FK_ReviewImages_Reviews] FOREIGN KEY([ReviewId])
REFERENCES [dbo].[Reviews] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ReviewImages] CHECK CONSTRAINT [FK_ReviewImages_Reviews]
GO
ALTER TABLE [dbo].[Reviews]  WITH CHECK ADD  CONSTRAINT [FK_Reviews_OrderItems] FOREIGN KEY([OrderItemId])
REFERENCES [dbo].[OrderItems] ([Id])
GO
ALTER TABLE [dbo].[Reviews] CHECK CONSTRAINT [FK_Reviews_OrderItems]
GO
ALTER TABLE [dbo].[StoreStaffs]  WITH CHECK ADD  CONSTRAINT [FK_StoreStaffs_Stores] FOREIGN KEY([StoreId])
REFERENCES [dbo].[Stores] ([Id])
GO
ALTER TABLE [dbo].[StoreStaffs] CHECK CONSTRAINT [FK_StoreStaffs_Stores]
GO
ALTER TABLE [dbo].[StoreStaffs]  WITH CHECK ADD  CONSTRAINT [FK_StoreStaffs_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([Id])
GO
ALTER TABLE [dbo].[StoreStaffs] CHECK CONSTRAINT [FK_StoreStaffs_Users]
GO
ALTER TABLE [dbo].[StoreSubscriptions]  WITH CHECK ADD  CONSTRAINT [FK_StoreSubscriptions_Plans] FOREIGN KEY([PlanId])
REFERENCES [dbo].[SubscriptionPlans] ([Id])
GO
ALTER TABLE [dbo].[StoreSubscriptions] CHECK CONSTRAINT [FK_StoreSubscriptions_Plans]
GO
ALTER TABLE [dbo].[StoreSubscriptions]  WITH CHECK ADD  CONSTRAINT [FK_StoreSubscriptions_Stores] FOREIGN KEY([StoreId])
REFERENCES [dbo].[Stores] ([Id])
GO
ALTER TABLE [dbo].[StoreSubscriptions] CHECK CONSTRAINT [FK_StoreSubscriptions_Stores]
GO
ALTER TABLE [dbo].[StoreSubscriptions]  WITH CHECK ADD  CONSTRAINT [FK_StoreSubscriptions_Users_UserId] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([Id])
GO
ALTER TABLE [dbo].[StoreSubscriptions] CHECK CONSTRAINT [FK_StoreSubscriptions_Users_UserId]
GO
ALTER TABLE [dbo].[StoreWallets]  WITH CHECK ADD  CONSTRAINT [FK_StoreWallets_Stores] FOREIGN KEY([StoreId])
REFERENCES [dbo].[Stores] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[StoreWallets] CHECK CONSTRAINT [FK_StoreWallets_Stores]
GO
ALTER TABLE [dbo].[UserRoles]  WITH CHECK ADD  CONSTRAINT [FK_UserRoles_Roles] FOREIGN KEY([RoleId])
REFERENCES [dbo].[Roles] ([Id])
GO
ALTER TABLE [dbo].[UserRoles] CHECK CONSTRAINT [FK_UserRoles_Roles]
GO
ALTER TABLE [dbo].[UserRoles]  WITH CHECK ADD  CONSTRAINT [FK_UserRoles_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([Id])
GO
ALTER TABLE [dbo].[UserRoles] CHECK CONSTRAINT [FK_UserRoles_Users]
GO
ALTER TABLE [dbo].[UserSessions]  WITH CHECK ADD  CONSTRAINT [FK_UserSessions_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([Id])
GO
ALTER TABLE [dbo].[UserSessions] CHECK CONSTRAINT [FK_UserSessions_Users]
GO
ALTER TABLE [dbo].[WalletTransactions]  WITH CHECK ADD  CONSTRAINT [FK_WalletTransactions_Orders] FOREIGN KEY([OrderId])
REFERENCES [dbo].[Orders] ([Id])
GO
ALTER TABLE [dbo].[WalletTransactions] CHECK CONSTRAINT [FK_WalletTransactions_Orders]
GO
ALTER TABLE [dbo].[WalletTransactions]  WITH CHECK ADD  CONSTRAINT [FK_WalletTransactions_StoreWallets] FOREIGN KEY([StoreWalletId])
REFERENCES [dbo].[StoreWallets] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[WalletTransactions] CHECK CONSTRAINT [FK_WalletTransactions_StoreWallets]
GO
ALTER TABLE [dbo].[WithdrawalRequests]  WITH CHECK ADD  CONSTRAINT [FK_WithdrawalRequests_Stores] FOREIGN KEY([StoreId])
REFERENCES [dbo].[Stores] ([Id])
GO
ALTER TABLE [dbo].[WithdrawalRequests] CHECK CONSTRAINT [FK_WithdrawalRequests_Stores]
GO
ALTER TABLE [dbo].[WithdrawalRequests]  WITH CHECK ADD  CONSTRAINT [FK_WithdrawalRequests_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([Id])
GO
ALTER TABLE [dbo].[WithdrawalRequests] CHECK CONSTRAINT [FK_WithdrawalRequests_Users]
GO
GO
GO
