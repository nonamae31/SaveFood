using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveFoodBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddStopRequestToComplaint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsStopRequested",
                table: "Complaints",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "StopRequestedByRole",
                table: "Complaints",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsStopRequested",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "StopRequestedByRole",
                table: "Complaints");
        }
    }
}
