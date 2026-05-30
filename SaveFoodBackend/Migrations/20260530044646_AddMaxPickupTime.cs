using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveFoodBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddMaxPickupTime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "MaxPickupTime",
                table: "Orders",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxPickupTime",
                table: "Orders");
        }
    }
}
