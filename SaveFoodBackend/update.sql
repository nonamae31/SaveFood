BEGIN TRANSACTION;
GO

DROP TABLE [RefundRequests];
GO

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[WithdrawalRequests]') AND [c].[name] = N'StoreId');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [WithdrawalRequests] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [WithdrawalRequests] ALTER COLUMN [StoreId] uniqueidentifier NULL;
GO

ALTER TABLE [WithdrawalRequests] ADD [UserId] uniqueidentifier NULL;
GO

ALTER TABLE [StoreSubscriptions] ADD [UserId] uniqueidentifier NULL;
GO

ALTER TABLE [CustomerWalletTransactions] ADD [ReferenceId] uniqueidentifier NULL;
GO

CREATE INDEX [IX_WithdrawalRequests_UserId] ON [WithdrawalRequests] ([UserId]);
GO

CREATE INDEX [IX_StoreSubscriptions_UserId] ON [StoreSubscriptions] ([UserId]);
GO

ALTER TABLE [StoreSubscriptions] ADD CONSTRAINT [FK_StoreSubscriptions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]);
GO

ALTER TABLE [WithdrawalRequests] ADD CONSTRAINT [FK_WithdrawalRequests_Users] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260606165742_MergeWithdrawalRequests', N'8.0.23');
GO

COMMIT;
GO

