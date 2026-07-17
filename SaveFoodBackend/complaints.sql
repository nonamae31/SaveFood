BEGIN TRANSACTION;
GO

CREATE TABLE [Complaints] (
    [Id] uniqueidentifier NOT NULL DEFAULT ((newid())),
    [CustomerId] uniqueidentifier NOT NULL,
    [StoreId] uniqueidentifier NOT NULL,
    [OrderId] uniqueidentifier NULL,
    [Title] nvarchar(255) NOT NULL,
    [Description] nvarchar(2000) NOT NULL,
    [Status] int NOT NULL,
    [Type] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT ((getutcdate())),
    [UpdatedAt] datetime2 NOT NULL DEFAULT ((getutcdate())),
    CONSTRAINT [PK_Complaints] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Complaints_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_Complaints_Stores_StoreId] FOREIGN KEY ([StoreId]) REFERENCES [Stores] ([Id]),
    CONSTRAINT [FK_Complaints_Users_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Users] ([Id])
);
GO

CREATE TABLE [ComplaintEvidences] (
    [Id] uniqueidentifier NOT NULL DEFAULT ((newid())),
    [ComplaintId] uniqueidentifier NOT NULL,
    [FileUrl] nvarchar(500) NOT NULL,
    [FileType] nvarchar(50) NOT NULL,
    CONSTRAINT [PK_ComplaintEvidences] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ComplaintEvidences_Complaints_ComplaintId] FOREIGN KEY ([ComplaintId]) REFERENCES [Complaints] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [ComplaintHistories] (
    [Id] uniqueidentifier NOT NULL DEFAULT ((newid())),
    [ComplaintId] uniqueidentifier NOT NULL,
    [OldStatus] int NOT NULL,
    [NewStatus] int NOT NULL,
    [ActionById] uniqueidentifier NOT NULL,
    [Note] nvarchar(1000) NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT ((getutcdate())),
    CONSTRAINT [PK_ComplaintHistories] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ComplaintHistories_Complaints_ComplaintId] FOREIGN KEY ([ComplaintId]) REFERENCES [Complaints] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ComplaintHistories_Users_ActionById] FOREIGN KEY ([ActionById]) REFERENCES [Users] ([Id])
);
GO

CREATE TABLE [ComplaintMessages] (
    [Id] uniqueidentifier NOT NULL DEFAULT ((newid())),
    [ComplaintId] uniqueidentifier NOT NULL,
    [SenderId] uniqueidentifier NOT NULL,
    [SenderRole] nvarchar(50) NOT NULL,
    [Content] nvarchar(2000) NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT ((getutcdate())),
    CONSTRAINT [PK_ComplaintMessages] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ComplaintMessages_Complaints_ComplaintId] FOREIGN KEY ([ComplaintId]) REFERENCES [Complaints] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ComplaintMessages_Users_SenderId] FOREIGN KEY ([SenderId]) REFERENCES [Users] ([Id])
);
GO

CREATE INDEX [IX_ComplaintEvidences_ComplaintId] ON [ComplaintEvidences] ([ComplaintId]);
GO

CREATE INDEX [IX_ComplaintHistories_ActionById] ON [ComplaintHistories] ([ActionById]);
GO

CREATE INDEX [IX_ComplaintHistories_ComplaintId] ON [ComplaintHistories] ([ComplaintId]);
GO

CREATE INDEX [IX_ComplaintMessages_ComplaintId] ON [ComplaintMessages] ([ComplaintId]);
GO

CREATE INDEX [IX_ComplaintMessages_SenderId] ON [ComplaintMessages] ([SenderId]);
GO

CREATE INDEX [IX_Complaints_CustomerId] ON [Complaints] ([CustomerId]);
GO

CREATE INDEX [IX_Complaints_OrderId] ON [Complaints] ([OrderId]);
GO

CREATE INDEX [IX_Complaints_StoreId] ON [Complaints] ([StoreId]);
GO

VALUES (N'20260709162013_AddComplaintEntities', N'8.0.23');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [WithdrawalRequests] ADD [IdempotencyKey] nvarchar(450) NULL;
GO

ALTER TABLE [CustomerWalletTransactions] ADD [PayOsOrderCode] bigint NULL;
GO

CREATE UNIQUE INDEX [IX_WithdrawalRequests_IdempotencyKey] ON [WithdrawalRequests] ([IdempotencyKey]) WHERE [IdempotencyKey] IS NOT NULL;
GO

CREATE UNIQUE INDEX [IX_CustomerWalletTransactions_PayOsOrderCode] ON [CustomerWalletTransactions] ([PayOsOrderCode]) WHERE [PayOsOrderCode] IS NOT NULL;
GO

VALUES (N'20260711161914_AddPayOsOrderCodeAndIdempotencyKey', N'8.0.23');
GO

COMMIT;
GO

