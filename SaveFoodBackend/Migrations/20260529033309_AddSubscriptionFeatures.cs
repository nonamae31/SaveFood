using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveFoodBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriptionFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxActiveListings",
                table: "SubscriptionPlans",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasCustomBanner",
                table: "SubscriptionPlans",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasFeaturedBadge",
                table: "SubscriptionPlans",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "PriorityLevel",
                table: "SubscriptionPlans",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "AnalyticsLevel",
                table: "SubscriptionPlans",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxActiveListings",
                table: "SubscriptionPlans");

            migrationBuilder.DropColumn(
                name: "HasCustomBanner",
                table: "SubscriptionPlans");

            migrationBuilder.DropColumn(
                name: "HasFeaturedBadge",
                table: "SubscriptionPlans");

            migrationBuilder.DropColumn(
                name: "PriorityLevel",
                table: "SubscriptionPlans");

            migrationBuilder.DropColumn(
                name: "AnalyticsLevel",
                table: "SubscriptionPlans");
        }
    }
}
