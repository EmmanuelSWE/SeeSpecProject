using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeeSpec.Migrations
{
    /// <inheritdoc />
    public partial class AddGenerationSnap : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GeneratedArtifactsJson",
                table: "SeeSpecGenerationSnapshots",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderName",
                table: "SeeSpecGenerationSnapshots",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TargetFilePathsJson",
                table: "SeeSpecGenerationSnapshots",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GeneratedArtifactsJson",
                table: "SeeSpecGenerationSnapshots");

            migrationBuilder.DropColumn(
                name: "ProviderName",
                table: "SeeSpecGenerationSnapshots");

            migrationBuilder.DropColumn(
                name: "TargetFilePathsJson",
                table: "SeeSpecGenerationSnapshots");
        }
    }
}
