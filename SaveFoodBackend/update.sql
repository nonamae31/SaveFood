BEGIN TRANSACTION;
GO

CREATE TABLE [CustomerVoucherFunds] (
    [Id] uniqueidentifier NOT NULL DEFAULT ((newid())),
    [CustomerId] uniqueidentifier NOT NULL,
    [AccumulatedBalance] decimal(18,2) NOT NULL,
    [TotalEarned] decimal(18,2) NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT ((sysutcdatetime())),
    [UpdatedAt] datetime2 NOT NULL DEFAULT ((sysutcdatetime())),
    CONSTRAINT [PK_CustomerVoucherFunds] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_CustomerVoucherFunds_Users] FOREIGN KEY ([CustomerId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [CustomerVoucherTransactions] (
    [Id] uniqueidentifier NOT NULL DEFAULT ((newid())),
    [CustomerVoucherFundId] uniqueidentifier NOT NULL,
    [OrderId] uniqueidentifier NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [OrderTotal] decimal(18,2) NOT NULL,
    [Type] tinyint NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT ((sysutcdatetime())),
    CONSTRAINT [PK_CustomerVoucherTransactions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_CustomerVoucherTransactions_Funds] FOREIGN KEY ([CustomerVoucherFundId]) REFERENCES [CustomerVoucherFunds] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_CustomerVoucherTransactions_Orders] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([Id]) ON DELETE NO ACTION
);
GO

CREATE UNIQUE INDEX [UQ_CustomerVoucherFunds_CustomerId] ON [CustomerVoucherFunds] ([CustomerId]);
GO

CREATE INDEX [IX_CustomerVoucherTransactions_FundId] ON [CustomerVoucherTransactions] ([CustomerVoucherFundId]);
GO

CREATE UNIQUE INDEX [UQ_CustomerVoucherTransactions_OrderId] ON [CustomerVoucherTransactions] ([OrderId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260712044718_AddCustomerVoucherFund', N'8.0.23');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Orders] ADD [VoucherDiscount] decimal(18,2) NOT NULL DEFAULT 0.0;
GO

ALTER TABLE [CustomerVoucherFunds] ADD [ReservedAmount] decimal(18,2) NOT NULL DEFAULT 0.0;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260712053911_SupportVoucherCheckout', N'8.0.23');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Complaints] ADD [IsStopRequested] bit NOT NULL DEFAULT CAST(0 AS bit);
GO

ALTER TABLE [Complaints] ADD [StopRequestedByRole] nvarchar(max) NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260712112357_AddStopRequestToComplaint', N'8.0.23');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260713030003_MergeFeatureHungAndComplaints', N'8.0.23');
GO

COMMIT;
GO

