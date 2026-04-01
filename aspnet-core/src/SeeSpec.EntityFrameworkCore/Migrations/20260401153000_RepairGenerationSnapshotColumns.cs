using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SeeSpec.EntityFrameworkCore;

#nullable disable

namespace SeeSpec.Migrations
{
    [DbContext(typeof(SeeSpecDbContext))]
    [Migration("20260401153000_RepairGenerationSnapshotColumns")]
    public partial class RepairGenerationSnapshotColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // This repair migration exists because earlier empty migrations were already
            // recorded in some databases, leaving the schema behind the current model.
            migrationBuilder.Sql(
                @"
ALTER TABLE ""SeeSpecGenerationSnapshots""
ADD COLUMN IF NOT EXISTS ""ModelName"" character varying(128) NOT NULL DEFAULT 'llama-3.3-70b-versatile';

ALTER TABLE ""SeeSpecGenerationSnapshots""
ADD COLUMN IF NOT EXISTS ""OutputText"" character varying(32000) NULL;

ALTER TABLE ""SeeSpecGenerationSnapshots""
ADD COLUMN IF NOT EXISTS ""SpecId"" uuid NULL;
");

            migrationBuilder.Sql(
                @"
CREATE INDEX IF NOT EXISTS ""IX_SeeSpecGenerationSnapshots_SpecId""
ON ""SeeSpecGenerationSnapshots"" (""SpecId"");
");

            migrationBuilder.Sql(
                @"
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FK_SeeSpecGenerationSnapshots_SeeSpecSpecs_SpecId'
    ) THEN
        ALTER TABLE ""SeeSpecGenerationSnapshots""
        ADD CONSTRAINT ""FK_SeeSpecGenerationSnapshots_SeeSpecSpecs_SpecId""
        FOREIGN KEY (""SpecId"") REFERENCES ""SeeSpecSpecs"" (""Id"") ON DELETE RESTRICT;
    END IF;
END $$;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FK_SeeSpecGenerationSnapshots_SeeSpecSpecs_SpecId'
    ) THEN
        ALTER TABLE ""SeeSpecGenerationSnapshots""
        DROP CONSTRAINT ""FK_SeeSpecGenerationSnapshots_SeeSpecSpecs_SpecId"";
    END IF;
END $$;
");

            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_SeeSpecGenerationSnapshots_SpecId"";");
            migrationBuilder.Sql(@"ALTER TABLE ""SeeSpecGenerationSnapshots"" DROP COLUMN IF EXISTS ""SpecId"";");
            migrationBuilder.Sql(@"ALTER TABLE ""SeeSpecGenerationSnapshots"" DROP COLUMN IF EXISTS ""OutputText"";");
            migrationBuilder.Sql(@"ALTER TABLE ""SeeSpecGenerationSnapshots"" DROP COLUMN IF EXISTS ""ModelName"";");
        }
    }
}
