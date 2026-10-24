using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskManagement.Data.Migrations
{
    /// <inheritdoc />
    public partial class UserWorkspaceName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "WorkspaceName",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WorkspaceName",
                table: "Users");
        }
    }
}
