using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveFoodBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddPayOsOrderCodeAndIdempotencyKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IdempotencyKey",
                table: "WithdrawalRequests",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "PayOsOrderCode",
                table: "CustomerWalletTransactions",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WithdrawalRequests_IdempotencyKey",
                table: "WithdrawalRequests",
                column: "IdempotencyKey",
                unique: true,
                filter: "[IdempotencyKey] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerWalletTransactions_PayOsOrderCode",
                table: "CustomerWalletTransactions",
                column: "PayOsOrderCode",
                unique: true,
                filter: "[PayOsOrderCode] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WithdrawalRequests_IdempotencyKey",
                table: "WithdrawalRequests");

            migrationBuilder.DropIndex(
                name: "IX_CustomerWalletTransactions_PayOsOrderCode",
                table: "CustomerWalletTransactions");

            migrationBuilder.DropColumn(
                name: "IdempotencyKey",
                table: "WithdrawalRequests");

            migrationBuilder.DropColumn(
                name: "PayOsOrderCode",
                table: "CustomerWalletTransactions");
        }
    }
}
