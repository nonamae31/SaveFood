using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveFoodBackend.Migrations
{
    public partial class SyncAuditFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // migrationBuilder.DropColumn(
            //     name: "PayOsPaymentLinkId",
            //     table: "Payments");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PayOsPaymentLinkId",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
