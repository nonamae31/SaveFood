using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveFoodBackend.Migrations
{
    /// <inheritdoc />
    public partial class MergeWithdrawalRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RefundRequests");

            migrationBuilder.AlterColumn<Guid>(
                name: "StoreId",
                table: "WithdrawalRequests",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "WithdrawalRequests",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "StoreSubscriptions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReferenceId",
                table: "CustomerWalletTransactions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WithdrawalRequests_UserId",
                table: "WithdrawalRequests",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_StoreSubscriptions_UserId",
                table: "StoreSubscriptions",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_StoreSubscriptions_Users_UserId",
                table: "StoreSubscriptions",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WithdrawalRequests_Users",
                table: "WithdrawalRequests",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StoreSubscriptions_Users_UserId",
                table: "StoreSubscriptions");

            migrationBuilder.DropForeignKey(
                name: "FK_WithdrawalRequests_Users",
                table: "WithdrawalRequests");

            migrationBuilder.DropIndex(
                name: "IX_WithdrawalRequests_UserId",
                table: "WithdrawalRequests");

            migrationBuilder.DropIndex(
                name: "IX_StoreSubscriptions_UserId",
                table: "StoreSubscriptions");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "WithdrawalRequests");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "StoreSubscriptions");

            migrationBuilder.DropColumn(
                name: "ReferenceId",
                table: "CustomerWalletTransactions");

            migrationBuilder.AlterColumn<Guid>(
                name: "StoreId",
                table: "WithdrawalRequests",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "RefundRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AdminNote = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    CustomerBankAccount = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CustomerBankAccountName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CustomerBankName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RefundRe__3214EC07722B756F", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefundRequests_Orders",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RefundRequests_Users",
                        column: x => x.RequestedBy,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_RefundRequests_OrderId",
                table: "RefundRequests",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_RefundRequests_RequestedBy",
                table: "RefundRequests",
                column: "RequestedBy");
        }
    }
}
