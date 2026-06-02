using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveFoodBackend.Migrations
{
    /// <inheritdoc />
    public partial class RefactorStoreAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Data Migration: Merge Ward into AddressLine
            migrationBuilder.Sql("UPDATE Stores SET AddressLine = AddressLine + ', ' + Ward WHERE Ward IS NOT NULL AND Ward != ''");
            
            // Data Migration: Move District to Ward
            migrationBuilder.Sql("UPDATE Stores SET Ward = District");

            migrationBuilder.DropColumn(
                name: "District",
                table: "Stores");

            migrationBuilder.RenameColumn(
                name: "AddressLine",
                table: "Stores",
                newName: "DetailedAddress");

            migrationBuilder.AlterColumn<string>(
                name: "Ward",
                table: "Stores",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DetailedAddress",
                table: "Stores",
                newName: "AddressLine");

            migrationBuilder.AlterColumn<string>(
                name: "Ward",
                table: "Stores",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<string>(
                name: "District",
                table: "Stores",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }
    }
}
