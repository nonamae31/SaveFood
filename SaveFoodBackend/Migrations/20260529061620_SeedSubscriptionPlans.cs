using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaveFoodBackend.Migrations
{
    /// <inheritdoc />
    public partial class SeedSubscriptionPlans : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "SubscriptionPlans",
                columns: new[] { "Id", "Description", "MaxActiveListings", "MonthlyPrice", "Name", "PlanFlags" },
                values: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), "Tối đa 5 tin đăng.Thống kê cơ bản", 5, 0m, "Free", (byte)1 });

            migrationBuilder.InsertData(
                table: "SubscriptionPlans",
                columns: new[] { "Id", "AnalyticsLevel", "Description", "HasCustomBanner", "MaxActiveListings", "MonthlyPrice", "Name", "PlanFlags", "PriorityLevel" },
                values: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), 1, "Tối đa 15 tin đăng.Banner tùy chỉnh.Thống kê nâng cao", true, 15, 149000m, "Plus", (byte)1, 1 });

            migrationBuilder.InsertData(
                table: "SubscriptionPlans",
                columns: new[] { "Id", "AnalyticsLevel", "Description", "HasCustomBanner", "HasFeaturedBadge", "MaxActiveListings", "MonthlyPrice", "Name", "PlanFlags", "PriorityLevel" },
                values: new object[] { new Guid("33333333-3333-3333-3333-333333333333"), 2, "Không giới hạn tin đăng.Banner tùy chỉnh.Huy hiệu Nổi bật.Ưu tiên lên top tìm kiếm.Thống kê cao cấp", true, true, null, 399000m, "Premium", (byte)1, 2 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SubscriptionPlans",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"));

            migrationBuilder.DeleteData(
                table: "SubscriptionPlans",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"));

            migrationBuilder.DeleteData(
                table: "SubscriptionPlans",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"));
        }
    }
}
