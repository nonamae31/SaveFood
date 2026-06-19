USE SaveFoodDB_MVP;

UPDATE CustomerWallets SET Balance = 10000000;

INSERT INTO CustomerWallets (Id, UserId, Balance, CreatedAt, UpdatedAt)
SELECT NEWID(), Id, 10000000, GETUTCDATE(), GETUTCDATE()
FROM Users
WHERE Id NOT IN (SELECT UserId FROM CustomerWallets);
