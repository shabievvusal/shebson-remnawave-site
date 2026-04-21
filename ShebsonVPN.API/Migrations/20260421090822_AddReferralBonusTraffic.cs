using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShebsonVPN.API.Migrations
{
    /// <inheritdoc />
    public partial class AddReferralBonusTraffic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "BonusTrafficBytes",
                table: "ReferralBonuses",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BonusTrafficBytes",
                table: "ReferralBonuses");
        }
    }
}
