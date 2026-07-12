BEGIN TRANSACTION;
GO

CREATE TABLE [Notifications] (
    [Id] uniqueidentifier NOT NULL DEFAULT ((newid())),
    [UserId] uniqueidentifier NOT NULL,
    [Title] nvarchar(255) NOT NULL,
    [Body] nvarchar(1000) NOT NULL,
    [Type] nvarchar(100) NOT NULL,
    [ReferenceId] uniqueidentifier NULL,
    [IsRead] bit NOT NULL DEFAULT CAST(0 AS bit),
    [CreatedAt] datetime2 NOT NULL DEFAULT ((getutcdate())),
    CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_Notifications_UserId] ON [Notifications] ([UserId]);
GO

CREATE INDEX [IX_Notifications_UserId_IsRead] ON [Notifications] ([UserId], [IsRead]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260630160313_AddNotificationsTable', N'8.0.23');
GO

COMMIT;
GO

