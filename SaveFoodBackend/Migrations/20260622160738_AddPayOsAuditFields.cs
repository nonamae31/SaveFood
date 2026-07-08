using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveFoodBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddPayOsAuditFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add PayOS audit fields to Payments
            migrationBuilder.AddColumn<string>(
                name: "PayOsReference",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PayerAccountNumber",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PayerName",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PayerBankId",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: true);

            // Add PayOS audit fields to StoreSubscriptions
            migrationBuilder.AddColumn<string>(
                name: "PayOsTransactionId",
                table: "StoreSubscriptions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PayerAccountNumber",
                table: "StoreSubscriptions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PayerName",
                table: "StoreSubscriptions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PayerBankId",
                table: "StoreSubscriptions",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert StoreSubscriptions columns
            migrationBuilder.DropColumn(name: "PayerBankId", table: "StoreSubscriptions");
            migrationBuilder.DropColumn(name: "PayerName", table: "StoreSubscriptions");
            migrationBuilder.DropColumn(name: "PayerAccountNumber", table: "StoreSubscriptions");
            migrationBuilder.DropColumn(name: "PayOsTransactionId", table: "StoreSubscriptions");

            // Revert Payments columns
            migrationBuilder.DropColumn(name: "PayerBankId", table: "Payments");
            migrationBuilder.DropColumn(name: "PayerName", table: "Payments");
            migrationBuilder.DropColumn(name: "PayerAccountNumber", table: "Payments");
            migrationBuilder.DropColumn(name: "PayOsReference", table: "Payments");
        }
    }
}
