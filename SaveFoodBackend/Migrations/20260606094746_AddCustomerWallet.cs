using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveFoodBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerWallet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CustomerWallets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Balance = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysutcdatetime())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysutcdatetime())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerWallets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerWallets_Users",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CustomerWalletTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    CustomerWalletId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Type = table.Column<byte>(type: "tinyint", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysutcdatetime())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerWalletTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerWalletTransactions_Orders",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CustomerWalletTransactions_Wallets",
                        column: x => x.CustomerWalletId,
                        principalTable: "CustomerWallets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "UQ_CustomerWallets_UserId",
                table: "CustomerWallets",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomerWalletTransactions_OrderId",
                table: "CustomerWalletTransactions",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerWalletTransactions_WalletId",
                table: "CustomerWalletTransactions",
                column: "CustomerWalletId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomerWalletTransactions");

            migrationBuilder.DropTable(
                name: "CustomerWallets");
        }
    }
}
