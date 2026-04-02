using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeeSpec.Migrations
{
    public partial class AddGenerationSnapshotArtifactMetadata : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
ALTER TABLE ""SeeSpecGenerationSnapshots""
ADD COLUMN IF NOT EXISTS ""ProviderName"" character varying(64) NOT NULL DEFAULT 'Groq';

ALTER TABLE ""SeeSpecGenerationSnapshots""
ADD COLUMN IF NOT EXISTS ""TargetFilePathsJson"" text NULL;

ALTER TABLE ""SeeSpecGenerationSnapshots""
ADD COLUMN IF NOT EXISTS ""GeneratedArtifactsJson"" text NULL;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE ""SeeSpecGenerationSnapshots"" DROP COLUMN IF EXISTS ""GeneratedArtifactsJson"";");
            migrationBuilder.Sql(@"ALTER TABLE ""SeeSpecGenerationSnapshots"" DROP COLUMN IF EXISTS ""TargetFilePathsJson"";");
            migrationBuilder.Sql(@"ALTER TABLE ""SeeSpecGenerationSnapshots"" DROP COLUMN IF EXISTS ""ProviderName"";");
        }
    }
}
