IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529033309_AddSubscriptionFeatures'
)
BEGIN
    ALTER TABLE [SubscriptionPlans] ADD [MaxActiveListings] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529033309_AddSubscriptionFeatures'
)
BEGIN
    ALTER TABLE [SubscriptionPlans] ADD [HasCustomBanner] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529033309_AddSubscriptionFeatures'
)
BEGIN
    ALTER TABLE [SubscriptionPlans] ADD [HasFeaturedBadge] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529033309_AddSubscriptionFeatures'
)
BEGIN
    ALTER TABLE [SubscriptionPlans] ADD [PriorityLevel] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529033309_AddSubscriptionFeatures'
)
BEGIN
    ALTER TABLE [SubscriptionPlans] ADD [AnalyticsLevel] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529033309_AddSubscriptionFeatures'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260529033309_AddSubscriptionFeatures', N'8.0.23');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529035816_AddStoreImagesFields'
)
BEGIN
    ALTER TABLE [Stores] ADD [CoverCloudinaryId] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529035816_AddStoreImagesFields'
)
BEGIN
    ALTER TABLE [Stores] ADD [CoverUrl] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529035816_AddStoreImagesFields'
)
BEGIN
    ALTER TABLE [Stores] ADD [LogoCloudinaryId] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529035816_AddStoreImagesFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260529035816_AddStoreImagesFields', N'8.0.23');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529061620_SeedSubscriptionPlans'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Description', N'MaxActiveListings', N'MonthlyPrice', N'Name', N'PlanFlags') AND [object_id] = OBJECT_ID(N'[SubscriptionPlans]'))
        SET IDENTITY_INSERT [SubscriptionPlans] ON;
    EXEC(N'INSERT INTO [SubscriptionPlans] ([Id], [Description], [MaxActiveListings], [MonthlyPrice], [Name], [PlanFlags])
    VALUES (''11111111-1111-1111-1111-111111111111'', N''Tối đa 5 tin đăng.Thống kê cơ bản'', 5, 0.0, N''Free'', CAST(1 AS tinyint))');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Description', N'MaxActiveListings', N'MonthlyPrice', N'Name', N'PlanFlags') AND [object_id] = OBJECT_ID(N'[SubscriptionPlans]'))
        SET IDENTITY_INSERT [SubscriptionPlans] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529061620_SeedSubscriptionPlans'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'AnalyticsLevel', N'Description', N'HasCustomBanner', N'MaxActiveListings', N'MonthlyPrice', N'Name', N'PlanFlags', N'PriorityLevel') AND [object_id] = OBJECT_ID(N'[SubscriptionPlans]'))
        SET IDENTITY_INSERT [SubscriptionPlans] ON;
    EXEC(N'INSERT INTO [SubscriptionPlans] ([Id], [AnalyticsLevel], [Description], [HasCustomBanner], [MaxActiveListings], [MonthlyPrice], [Name], [PlanFlags], [PriorityLevel])
    VALUES (''22222222-2222-2222-2222-222222222222'', 1, N''Tối đa 15 tin đăng.Banner tùy chỉnh.Thống kê nâng cao'', CAST(1 AS bit), 15, 149000.0, N''Plus'', CAST(1 AS tinyint), 1)');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'AnalyticsLevel', N'Description', N'HasCustomBanner', N'MaxActiveListings', N'MonthlyPrice', N'Name', N'PlanFlags', N'PriorityLevel') AND [object_id] = OBJECT_ID(N'[SubscriptionPlans]'))
        SET IDENTITY_INSERT [SubscriptionPlans] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529061620_SeedSubscriptionPlans'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'AnalyticsLevel', N'Description', N'HasCustomBanner', N'HasFeaturedBadge', N'MaxActiveListings', N'MonthlyPrice', N'Name', N'PlanFlags', N'PriorityLevel') AND [object_id] = OBJECT_ID(N'[SubscriptionPlans]'))
        SET IDENTITY_INSERT [SubscriptionPlans] ON;
    EXEC(N'INSERT INTO [SubscriptionPlans] ([Id], [AnalyticsLevel], [Description], [HasCustomBanner], [HasFeaturedBadge], [MaxActiveListings], [MonthlyPrice], [Name], [PlanFlags], [PriorityLevel])
    VALUES (''33333333-3333-3333-3333-333333333333'', 2, N''Không giới hạn tin đăng.Banner tùy chỉnh.Huy hiệu Nổi bật.Ưu tiên lên top tìm kiếm.Thống kê cao cấp'', CAST(1 AS bit), CAST(1 AS bit), NULL, 399000.0, N''Premium'', CAST(1 AS tinyint), 2)');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'AnalyticsLevel', N'Description', N'HasCustomBanner', N'HasFeaturedBadge', N'MaxActiveListings', N'MonthlyPrice', N'Name', N'PlanFlags', N'PriorityLevel') AND [object_id] = OBJECT_ID(N'[SubscriptionPlans]'))
        SET IDENTITY_INSERT [SubscriptionPlans] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529061620_SeedSubscriptionPlans'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260529061620_SeedSubscriptionPlans', N'8.0.23');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529143925_AddCheckoutAndPayOSFields'
)
BEGIN
    ALTER TABLE [Orders] ADD [OrderCode] bigint NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529143925_AddCheckoutAndPayOSFields'
)
BEGIN
    ALTER TABLE [Orders] ADD [PickupCode] nvarchar(10) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529143925_AddCheckoutAndPayOSFields'
)
BEGIN
    ALTER TABLE [Orders] ADD [ReservationExpiresAt] datetime NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529143925_AddCheckoutAndPayOSFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260529143925_AddCheckoutAndPayOSFields', N'8.0.23');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530032916_AddExpectedPickupTime'
)
BEGIN
    ALTER TABLE [Orders] ADD [ExpectedPickupTime] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530032916_AddExpectedPickupTime'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260530032916_AddExpectedPickupTime', N'8.0.23');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530044646_AddMaxPickupTime'
)
BEGIN
    ALTER TABLE [Orders] ADD [MaxPickupTime] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530044646_AddMaxPickupTime'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260530044646_AddMaxPickupTime', N'8.0.23');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530045423_AddAgreedToNoRefundPolicy'
)
BEGIN
    ALTER TABLE [Orders] ADD [AgreedToNoRefundPolicy] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530045423_AddAgreedToNoRefundPolicy'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260530045423_AddAgreedToNoRefundPolicy', N'8.0.23');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530095958_AddOrderCodeToStoreSubscription'
)
BEGIN
    ALTER TABLE [StoreSubscriptions] ADD [OrderCode] bigint NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530095958_AddOrderCodeToStoreSubscription'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260530095958_AddOrderCodeToStoreSubscription', N'8.0.23');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530124720_AddReviewImagesAndStoreReply'
)
BEGIN
    ALTER TABLE [Reviews] ADD [StoreReply] nvarchar(1000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530124720_AddReviewImagesAndStoreReply'
)
BEGIN
    ALTER TABLE [Reviews] ADD [StoreReplyAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530124720_AddReviewImagesAndStoreReply'
)
BEGIN
    ALTER TABLE [Reviews] ADD [UpdatedAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530124720_AddReviewImagesAndStoreReply'
)
BEGIN
    CREATE TABLE [ReviewImages] (
        [Id] uniqueidentifier NOT NULL DEFAULT ((newid())),
        [ReviewId] uniqueidentifier NOT NULL,
        [ImageUrl] nvarchar(500) NOT NULL,
        [CloudinaryPublicId] nvarchar(255) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT ((sysutcdatetime())),
        CONSTRAINT [PK_ReviewImages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ReviewImages_Reviews] FOREIGN KEY ([ReviewId]) REFERENCES [Reviews] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530124720_AddReviewImagesAndStoreReply'
)
BEGIN
    CREATE INDEX [IX_ReviewImages_ReviewId] ON [ReviewImages] ([ReviewId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530124720_AddReviewImagesAndStoreReply'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260530124720_AddReviewImagesAndStoreReply', N'8.0.23');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530144845_AddUserLocation'
)
BEGIN
    ALTER TABLE [Users] ADD [Latitude] decimal(9,6) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530144845_AddUserLocation'
)
BEGIN
    ALTER TABLE [Users] ADD [Longitude] decimal(9,6) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530144845_AddUserLocation'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260530144845_AddUserLocation', N'8.0.23');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260531135614_RefactorStoreAddress'
)
BEGIN
    UPDATE Stores SET AddressLine = AddressLine + ', ' + Ward WHERE Ward IS NOT NULL AND Ward != ''
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260531135614_RefactorStoreAddress'
)
BEGIN
    UPDATE Stores SET Ward = District
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260531135614_RefactorStoreAddress'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Stores]') AND [c].[name] = N'District');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Stores] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [Stores] DROP COLUMN [District];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260531135614_RefactorStoreAddress'
)
BEGIN
    EXEC sp_rename N'[Stores].[AddressLine]', N'DetailedAddress', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260531135614_RefactorStoreAddress'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Stores]') AND [c].[name] = N'Ward');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Stores] DROP CONSTRAINT [' + @var1 + '];');
    EXEC(N'UPDATE [Stores] SET [Ward] = N'''' WHERE [Ward] IS NULL');
    ALTER TABLE [Stores] ALTER COLUMN [Ward] nvarchar(100) NOT NULL;
    ALTER TABLE [Stores] ADD DEFAULT N'' FOR [Ward];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260531135614_RefactorStoreAddress'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260531135614_RefactorStoreAddress', N'8.0.23');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606094746_AddCustomerWallet'
)
BEGIN
    CREATE TABLE [CustomerWallets] (
        [Id] uniqueidentifier NOT NULL DEFAULT ((newid())),
        [UserId] uniqueidentifier NOT NULL,
        [Balance] decimal(18,2) NOT NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT ((sysutcdatetime())),
        [UpdatedAt] datetime2 NOT NULL DEFAULT ((sysutcdatetime())),
        CONSTRAINT [PK_CustomerWallets] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CustomerWallets_Users] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606094746_AddCustomerWallet'
)
BEGIN
    CREATE TABLE [CustomerWalletTransactions] (
        [Id] uniqueidentifier NOT NULL DEFAULT ((newid())),
        [CustomerWalletId] uniqueidentifier NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [Type] tinyint NOT NULL,
        [Status] tinyint NOT NULL,
        [OrderId] uniqueidentifier NULL,
        [Description] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL DEFAULT ((sysutcdatetime())),
        CONSTRAINT [PK_CustomerWalletTransactions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CustomerWalletTransactions_Orders] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_CustomerWalletTransactions_Wallets] FOREIGN KEY ([CustomerWalletId]) REFERENCES [CustomerWallets] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606094746_AddCustomerWallet'
)
BEGIN
    CREATE UNIQUE INDEX [UQ_CustomerWallets_UserId] ON [CustomerWallets] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606094746_AddCustomerWallet'
)
BEGIN
    CREATE INDEX [IX_CustomerWalletTransactions_OrderId] ON [CustomerWalletTransactions] ([OrderId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606094746_AddCustomerWallet'
)
BEGIN
    CREATE INDEX [IX_CustomerWalletTransactions_WalletId] ON [CustomerWalletTransactions] ([CustomerWalletId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606094746_AddCustomerWallet'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260606094746_AddCustomerWallet', N'8.0.23');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606122121_AddStoreTrustFields'
)
BEGIN
    EXEC sp_rename N'[Stores].[TaxCode]', N'StorefrontImageUrl', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606122121_AddStoreTrustFields'
)
BEGIN
    EXEC sp_rename N'[Stores].[BusinessLicenseUrl]', N'ReferenceLink', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606122121_AddStoreTrustFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260606122121_AddStoreTrustFields', N'8.0.23');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606165742_MergeWithdrawalRequests'
)
BEGIN
    DROP TABLE [RefundRequests];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606165742_MergeWithdrawalRequests'
)
BEGIN
    DECLARE @var2 sysname;
    SELECT @var2 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[WithdrawalRequests]') AND [c].[name] = N'StoreId');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [WithdrawalRequests] DROP CONSTRAINT [' + @var2 + '];');
    ALTER TABLE [WithdrawalRequests] ALTER COLUMN [StoreId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606165742_MergeWithdrawalRequests'
)
BEGIN
    ALTER TABLE [WithdrawalRequests] ADD [UserId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606165742_MergeWithdrawalRequests'
)
BEGIN
    ALTER TABLE [StoreSubscriptions] ADD [UserId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606165742_MergeWithdrawalRequests'
)
BEGIN
    ALTER TABLE [CustomerWalletTransactions] ADD [ReferenceId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606165742_MergeWithdrawalRequests'
)
BEGIN
    CREATE INDEX [IX_WithdrawalRequests_UserId] ON [WithdrawalRequests] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606165742_MergeWithdrawalRequests'
)
BEGIN
    CREATE INDEX [IX_StoreSubscriptions_UserId] ON [StoreSubscriptions] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606165742_MergeWithdrawalRequests'
)
BEGIN
    ALTER TABLE [StoreSubscriptions] ADD CONSTRAINT [FK_StoreSubscriptions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606165742_MergeWithdrawalRequests'
)
BEGIN
    ALTER TABLE [WithdrawalRequests] ADD CONSTRAINT [FK_WithdrawalRequests_Users] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260606165742_MergeWithdrawalRequests'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260606165742_MergeWithdrawalRequests', N'8.0.23');
END;
GO

COMMIT;
GO

