using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using SaveFoodBackend.Models;

namespace SaveFoodBackend.Data;

public partial class SaveFoodDbContext : DbContext
{
    public SaveFoodDbContext()
    {
    }

    public SaveFoodDbContext(DbContextOptions<SaveFoodDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Cart> Carts { get; set; }

    public virtual DbSet<CartItem> CartItems { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<ClearanceListing> ClearanceListings { get; set; }

    public virtual DbSet<EmailVerification> EmailVerifications { get; set; }

    public virtual DbSet<ListingDiscountRule> ListingDiscountRules { get; set; }

    public virtual DbSet<ListingImage> ListingImages { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderItem> OrderItems { get; set; }

    public virtual DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductImage> ProductImages { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<ReviewImage> ReviewImages { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Store> Stores { get; set; }

    public virtual DbSet<StoreStaff> StoreStaffs { get; set; }

    public virtual DbSet<StoreSubscription> StoreSubscriptions { get; set; }

    public virtual DbSet<StoreWallet> StoreWallets { get; set; }

    public virtual DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserRole> UserRoles { get; set; }



    public virtual DbSet<WalletTransaction> WalletTransactions { get; set; }

    public virtual DbSet<WithdrawalRequest> WithdrawalRequests { get; set; }

    public virtual DbSet<CustomerWallet> CustomerWallets { get; set; }

    public virtual DbSet<CustomerWalletTransaction> CustomerWalletTransactions { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseSqlServer("Name=ConnectionStrings:DefaultConnection");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cart>(entity =>
        {
            entity.HasIndex(e => e.UserId, "UQ_Carts_UserId").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

            entity.HasOne(d => d.User).WithOne(p => p.Cart)
                .HasForeignKey<Cart>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Carts_Users");
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

            entity.HasOne(d => d.Cart).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.CartId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CartItems_Carts");

            entity.HasOne(d => d.Listing).WithMany(p => p.CartItems)
                .HasForeignKey(d => d.ListingId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CartItems_Listings");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<ClearanceListing>(entity =>
        {
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.SalePrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Title).HasMaxLength(250);

            entity.HasOne(d => d.Product).WithMany(p => p.ClearanceListings)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ClearanceListings_Products");
        });

        modelBuilder.Entity<EmailVerification>(entity =>
        {
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.VerificationCode).HasMaxLength(20);

            entity.HasOne(d => d.User).WithMany(p => p.EmailVerifications)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_EmailVerifications_Users");
        });

        modelBuilder.Entity<ListingDiscountRule>(entity =>
        {
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.DiscountPercent).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.RuleFlags).HasDefaultValue((byte)1);
            entity.Property(e => e.TargetPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Listing).WithMany(p => p.ListingDiscountRules)
                .HasForeignKey(d => d.ListingId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ListingDiscountRules_Listings");
        });

        modelBuilder.Entity<ListingImage>(entity =>
        {
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.CloudinaryPublicId).HasMaxLength(255);

            entity.HasOne(d => d.Listing).WithMany(p => p.ListingImages)
                .HasForeignKey(d => d.ListingId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ListingImages_Listings");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PickupCode).HasMaxLength(10);
            entity.Property(e => e.OrderCode).HasColumnType("bigint");
            entity.Property(e => e.ReservationExpiresAt).HasColumnType("datetime");

            entity.HasOne(d => d.ConfirmedBy).WithMany(p => p.OrderConfirmedBies)
                .HasForeignKey(d => d.ConfirmedById)
                .HasConstraintName("FK_Orders_ConfirmedBy");

            entity.HasOne(d => d.Store).WithMany(p => p.Orders)
                .HasForeignKey(d => d.StoreId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Orders_Stores");

            entity.HasOne(d => d.User).WithMany(p => p.OrderUsers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Orders_Users");
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.ProductNameSnapshot).HasMaxLength(250);
            entity.Property(e => e.UnitPriceSnapshot).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Listing).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.ListingId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderItems_Listings");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderItems_Orders");
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.ResetToken).HasMaxLength(200);

            entity.HasOne(d => d.User).WithMany(p => p.PasswordResetTokens)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PasswordResetTokens_Users");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasIndex(e => e.OrderId, "UQ_Payments_OrderId").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Order).WithOne(p => p.Payment)
                .HasForeignKey<Payment>(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Payments_Orders");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.OriginalPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Category).WithMany(p => p.Products)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Products_Categories");

            entity.HasOne(d => d.Store).WithMany(p => p.Products)
                .HasForeignKey(d => d.StoreId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Products_Stores");
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.CloudinaryPublicId).HasMaxLength(255);

            entity.HasOne(d => d.Product).WithMany(p => p.ProductImages)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ProductImages_Products");
        });



        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasIndex(e => e.OrderItemId, "UQ_Reviews_OrderItemId").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Comment).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.StoreReply).HasMaxLength(1000);

            entity.HasOne(d => d.OrderItem).WithOne(p => p.Review)
                .HasForeignKey<Review>(d => d.OrderItemId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Reviews_OrderItems");
        });

        modelBuilder.Entity<ReviewImage>(entity =>
        {
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.CloudinaryPublicId).HasMaxLength(255);

            entity.HasOne(d => d.Review).WithMany(p => p.ReviewImages)
                .HasForeignKey(d => d.ReviewId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_ReviewImages_Reviews");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasIndex(e => e.Code, "UQ_Roles_Code").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Code).HasMaxLength(50);
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<Store>(entity =>
        {
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.DetailedAddress).HasMaxLength(300);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Latitude).HasColumnType("decimal(9, 6)");
            entity.Property(e => e.LogoUrl).HasMaxLength(500);
            entity.Property(e => e.Longitude).HasColumnType("decimal(9, 6)");
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.ReviewNotes).HasMaxLength(1000);
            entity.Property(e => e.TrustScore).HasDefaultValue(100);
            entity.Property(e => e.Ward).HasMaxLength(100);
        });

        modelBuilder.Entity<StoreStaff>(entity =>
        {
            entity.HasIndex(e => new { e.StoreId, e.UserId }, "UQ_StoreStaffs_Store_User").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.JoinedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.StaffFlags).HasDefaultValue((byte)1);

            entity.HasOne(d => d.Store).WithMany(p => p.StoreStaffs)
                .HasForeignKey(d => d.StoreId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StoreStaffs_Stores");

            entity.HasOne(d => d.User).WithMany(p => p.StoreStaffs)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StoreStaffs_Users");
        });

        modelBuilder.Entity<StoreSubscription>(entity =>
        {
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Plan).WithMany(p => p.StoreSubscriptions)
                .HasForeignKey(d => d.PlanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StoreSubscriptions_Plans");

            entity.HasOne(d => d.Store).WithMany(p => p.StoreSubscriptions)
                .HasForeignKey(d => d.StoreId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StoreSubscriptions_Stores");
        });

        modelBuilder.Entity<StoreWallet>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__StoreWal__3214EC07655DB49F");

            entity.HasIndex(e => e.StoreId, "IX_StoreWallets_StoreId");

            entity.HasIndex(e => e.StoreId, "UQ__StoreWal__3B82F100E99E60F3").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.AvailableBalance).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.PendingBalance).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.Store).WithOne(p => p.StoreWallet)
                .HasForeignKey<StoreWallet>(d => d.StoreId)
                .HasConstraintName("FK_StoreWallets_Stores");
        });

        modelBuilder.Entity<SubscriptionPlan>(entity =>
        {
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.MonthlyPrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.PlanFlags).HasDefaultValue((byte)1);
            entity.Property(e => e.HasCustomBanner).HasDefaultValue(false);
            entity.Property(e => e.HasFeaturedBadge).HasDefaultValue(false);
            entity.Property(e => e.PriorityLevel).HasDefaultValue(0);
            entity.Property(e => e.AnalyticsLevel).HasDefaultValue(0);

            entity.HasData(
                new SubscriptionPlan
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    Name = "Free",
                    Description = "Tối đa 5 tin đăng.Thống kê cơ bản",
                    MonthlyPrice = 0,
                    PlanFlags = 1,
                    MaxActiveListings = 5,
                    HasCustomBanner = false,
                    HasFeaturedBadge = false,
                    PriorityLevel = 0,
                    AnalyticsLevel = 0
                },
                new SubscriptionPlan
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    Name = "Plus",
                    Description = "Tối đa 15 tin đăng.Banner tùy chỉnh.Thống kê nâng cao",
                    MonthlyPrice = 149000,
                    PlanFlags = 1,
                    MaxActiveListings = 15,
                    HasCustomBanner = true,
                    HasFeaturedBadge = false,
                    PriorityLevel = 1,
                    AnalyticsLevel = 1
                },
                new SubscriptionPlan
                {
                    Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Name = "Premium",
                    Description = "Không giới hạn tin đăng.Banner tùy chỉnh.Huy hiệu Nổi bật.Ưu tiên lên top tìm kiếm.Thống kê cao cấp",
                    MonthlyPrice = 399000,
                    PlanFlags = 1,
                    MaxActiveListings = null, // Unlimited
                    HasCustomBanner = true,
                    HasFeaturedBadge = true,
                    PriorityLevel = 2,
                    AnalyticsLevel = 2
                }
            );
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email, "UQ_Users_Email").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Address).HasMaxLength(300);
            entity.Property(e => e.AvatarUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.FullName).HasMaxLength(150);
            entity.Property(e => e.Latitude).HasColumnType("decimal(9, 6)");
            entity.Property(e => e.Longitude).HasColumnType("decimal(9, 6)");
            entity.Property(e => e.NormalizedEmail).HasMaxLength(255);
            entity.Property(e => e.PasswordHash).HasMaxLength(500);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.Username).HasMaxLength(50);
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.RoleId }, "UQ_UserRoles_User_Role").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

            entity.HasOne(d => d.Role).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserRoles_Roles");

            entity.HasOne(d => d.User).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserRoles_Users");
        });



        modelBuilder.Entity<WalletTransaction>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__WalletTr__3214EC075F798F76");

            entity.HasIndex(e => e.OrderId, "IX_WalletTransactions_OrderId");

            entity.HasIndex(e => e.StoreWalletId, "IX_WalletTransactions_StoreWalletId");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.HasOne(d => d.Order).WithMany(p => p.WalletTransactions)
                .HasForeignKey(d => d.OrderId)
                .HasConstraintName("FK_WalletTransactions_Orders");

            entity.HasOne(d => d.StoreWallet).WithMany(p => p.WalletTransactions)
                .HasForeignKey(d => d.StoreWalletId)
                .HasConstraintName("FK_WalletTransactions_StoreWallets");
        });

        modelBuilder.Entity<WithdrawalRequest>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Withdraw__3214EC07A81D6E6A");

            entity.HasIndex(e => e.StoreId, "IX_WithdrawalRequests_StoreId");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.AdminNote).HasMaxLength(500);
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.BankAccountName).HasMaxLength(255);
            entity.Property(e => e.BankAccountNumber).HasMaxLength(50);
            entity.Property(e => e.BankName).HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.Store).WithMany(p => p.WithdrawalRequests)
                .HasForeignKey(d => d.StoreId)
                .HasConstraintName("FK_WithdrawalRequests_Stores");

            entity.HasOne(d => d.User).WithMany(p => p.WithdrawalRequests)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_WithdrawalRequests_Users");
        });

        modelBuilder.Entity<CustomerWallet>(entity =>
        {
            entity.HasIndex(e => e.UserId, "UQ_CustomerWallets_UserId").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Balance).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.User).WithOne(p => p.CustomerWallet)
                .HasForeignKey<CustomerWallet>(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_CustomerWallets_Users");
        });

        modelBuilder.Entity<CustomerWalletTransaction>(entity =>
        {
            entity.HasIndex(e => e.CustomerWalletId, "IX_CustomerWalletTransactions_WalletId");
            entity.HasIndex(e => e.OrderId, "IX_CustomerWalletTransactions_OrderId");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.HasOne(d => d.CustomerWallet).WithMany(p => p.CustomerWalletTransactions)
                .HasForeignKey(d => d.CustomerWalletId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_CustomerWalletTransactions_Wallets");

            entity.HasOne(d => d.Order).WithMany(p => p.CustomerWalletTransactions)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_CustomerWalletTransactions_Orders");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
