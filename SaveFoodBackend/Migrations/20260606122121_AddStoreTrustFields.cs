using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveFoodBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddStoreTrustFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TaxCode",
                table: "Stores",
                newName: "StorefrontImageUrl");

            migrationBuilder.RenameColumn(
                name: "BusinessLicenseUrl",
                table: "Stores",
                newName: "ReferenceLink");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "StorefrontImageUrl",
                table: "Stores",
                newName: "TaxCode");

            migrationBuilder.RenameColumn(
                name: "ReferenceLink",
                table: "Stores",
                newName: "BusinessLicenseUrl");
        }
    }
}
