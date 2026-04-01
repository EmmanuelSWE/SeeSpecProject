using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeeSpec.EntityFrameworkCore.Migrations
{
    public partial class AddAiSnapshotSpecFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ModelName",
                table: "SeeSpecGenerationSnapshots",
                type: "character varying(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "llama-3.3-70b-versatile");

            migrationBuilder.AddColumn<string>(
                name: "OutputText",
                table: "SeeSpecGenerationSnapshots",
                type: "character varying(32000)",
                maxLength: 32000,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SpecId",
                table: "SeeSpecGenerationSnapshots",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecGenerationSnapshots_SpecId",
                table: "SeeSpecGenerationSnapshots",
                column: "SpecId");

            migrationBuilder.AddForeignKey(
                name: "FK_SeeSpecGenerationSnapshots_SeeSpecSpecs_SpecId",
                table: "SeeSpecGenerationSnapshots",
                column: "SpecId",
                principalTable: "SeeSpecSpecs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SeeSpecGenerationSnapshots_SeeSpecSpecs_SpecId",
                table: "SeeSpecGenerationSnapshots");

            migrationBuilder.DropIndex(
                name: "IX_SeeSpecGenerationSnapshots_SpecId",
                table: "SeeSpecGenerationSnapshots");

            migrationBuilder.DropColumn(
                name: "ModelName",
                table: "SeeSpecGenerationSnapshots");

            migrationBuilder.DropColumn(
                name: "OutputText",
                table: "SeeSpecGenerationSnapshots");

            migrationBuilder.DropColumn(
                name: "SpecId",
                table: "SeeSpecGenerationSnapshots");
        }
    }
}
