using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveFoodBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddAgreedToNoRefundPolicy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AgreedToNoRefundPolicy",
                table: "Orders",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AgreedToNoRefundPolicy",
                table: "Orders");
        }
    }
}
