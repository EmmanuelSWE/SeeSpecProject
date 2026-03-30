using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SeeSpec.Migrations
{
    /// <inheritdoc />
    public partial class AddSeeSpecDomainEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SeeSpecBackends",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Slug = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Framework = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    RuntimeVersion = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RepositoryUrl = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeeSpecBackends", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SeeSpecGenerationSnapshots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BackendId = table.Column<Guid>(type: "uuid", nullable: false),
                    TriggeredByUserId = table.Column<long>(type: "bigint", nullable: false),
                    Mode = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Summary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    AffectedSectionIdsJson = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    PromptSent = table.Column<string>(type: "character varying(12000)", maxLength: 12000, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeeSpecGenerationSnapshots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeeSpecGenerationSnapshots_AbpUsers_TriggeredByUserId",
                        column: x => x.TriggeredByUserId,
                        principalTable: "AbpUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SeeSpecGenerationSnapshots_SeeSpecBackends_BackendId",
                        column: x => x.BackendId,
                        principalTable: "SeeSpecBackends",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SeeSpecSpecs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BackendId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Version = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeeSpecSpecs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeeSpecSpecs_SeeSpecBackends_BackendId",
                        column: x => x.BackendId,
                        principalTable: "SeeSpecBackends",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SeeSpecTeams",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BackendId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeeSpecTeams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeeSpecTeams_SeeSpecBackends_BackendId",
                        column: x => x.BackendId,
                        principalTable: "SeeSpecBackends",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SeeSpecValidationResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BackendId = table.Column<Guid>(type: "uuid", nullable: false),
                    GenerationSnapshotId = table.Column<Guid>(type: "uuid", nullable: true),
                    Passed = table.Column<bool>(type: "boolean", nullable: false),
                    GeneratedFilePath = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    DiffSummary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    DetailsJson = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeeSpecValidationResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeeSpecValidationResults_SeeSpecBackends_BackendId",
                        column: x => x.BackendId,
                        principalTable: "SeeSpecBackends",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SeeSpecValidationResults_SeeSpecGenerationSnapshots_Generat~",
                        column: x => x.GenerationSnapshotId,
                        principalTable: "SeeSpecGenerationSnapshots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SeeSpecSpecSections",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SpecId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentSectionId = table.Column<Guid>(type: "uuid", nullable: true),
                    Title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Slug = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    SectionType = table.Column<int>(type: "integer", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    Content = table.Column<string>(type: "character varying(12000)", maxLength: 12000, nullable: true),
                    OwnerRole = table.Column<int>(type: "integer", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeeSpecSpecSections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeeSpecSpecSections_SeeSpecSpecSections_ParentSectionId",
                        column: x => x.ParentSectionId,
                        principalTable: "SeeSpecSpecSections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SeeSpecSpecSections_SeeSpecSpecs_SpecId",
                        column: x => x.SpecId,
                        principalTable: "SeeSpecSpecs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SeeSpecAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BackendId = table.Column<Guid>(type: "uuid", nullable: false),
                    TeamId = table.Column<Guid>(type: "uuid", nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeeSpecAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeeSpecAssignments_AbpUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AbpUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SeeSpecAssignments_SeeSpecBackends_BackendId",
                        column: x => x.BackendId,
                        principalTable: "SeeSpecBackends",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SeeSpecAssignments_SeeSpecTeams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "SeeSpecTeams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SeeSpecDiagramElements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BackendId = table.Column<Guid>(type: "uuid", nullable: false),
                    SpecSectionId = table.Column<Guid>(type: "uuid", nullable: true),
                    DiagramType = table.Column<int>(type: "integer", nullable: false),
                    ExternalElementKey = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    MetadataJson = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeeSpecDiagramElements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeeSpecDiagramElements_SeeSpecBackends_BackendId",
                        column: x => x.BackendId,
                        principalTable: "SeeSpecBackends",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SeeSpecDiagramElements_SeeSpecSpecSections_SpecSectionId",
                        column: x => x.SpecSectionId,
                        principalTable: "SeeSpecSpecSections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SeeSpecSectionDependencies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FromSectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ToSectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    DependencyType = table.Column<int>(type: "integer", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeeSpecSectionDependencies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeeSpecSectionDependencies_SeeSpecSpecSections_FromSectionId",
                        column: x => x.FromSectionId,
                        principalTable: "SeeSpecSpecSections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SeeSpecSectionDependencies_SeeSpecSpecSections_ToSectionId",
                        column: x => x.ToSectionId,
                        principalTable: "SeeSpecSpecSections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SeeSpecSectionItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SpecSectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Label = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Content = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    ItemType = table.Column<int>(type: "integer", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeeSpecSectionItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeeSpecSectionItems_SeeSpecSpecSections_SpecSectionId",
                        column: x => x.SpecSectionId,
                        principalTable: "SeeSpecSpecSections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SeeSpecTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BackendId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    AssignedToUserId = table.Column<long>(type: "bigint", nullable: true),
                    TeamId = table.Column<Guid>(type: "uuid", nullable: true),
                    SpecSectionId = table.Column<Guid>(type: "uuid", nullable: true),
                    DueAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeeSpecTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeeSpecTasks_AbpUsers_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalTable: "AbpUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SeeSpecTasks_AbpUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AbpUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SeeSpecTasks_SeeSpecBackends_BackendId",
                        column: x => x.BackendId,
                        principalTable: "SeeSpecBackends",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SeeSpecTasks_SeeSpecSpecSections_SpecSectionId",
                        column: x => x.SpecSectionId,
                        principalTable: "SeeSpecSpecSections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SeeSpecTasks_SeeSpecTeams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "SeeSpecTeams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SeeSpecNotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BackendId = table.Column<Guid>(type: "uuid", nullable: false),
                    TaskId = table.Column<Guid>(type: "uuid", nullable: true),
                    GenerationSnapshotId = table.Column<Guid>(type: "uuid", nullable: true),
                    AuthorUserId = table.Column<long>(type: "bigint", nullable: false),
                    NoteType = table.Column<int>(type: "integer", nullable: false),
                    Body = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    OutcomeSummary = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeeSpecNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeeSpecNotes_AbpUsers_AuthorUserId",
                        column: x => x.AuthorUserId,
                        principalTable: "AbpUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SeeSpecNotes_SeeSpecBackends_BackendId",
                        column: x => x.BackendId,
                        principalTable: "SeeSpecBackends",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SeeSpecNotes_SeeSpecGenerationSnapshots_GenerationSnapshotId",
                        column: x => x.GenerationSnapshotId,
                        principalTable: "SeeSpecGenerationSnapshots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SeeSpecNotes_SeeSpecTasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "SeeSpecTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecAssignments_BackendId_UserId",
                table: "SeeSpecAssignments",
                columns: new[] { "BackendId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecAssignments_TeamId_IsActive",
                table: "SeeSpecAssignments",
                columns: new[] { "TeamId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecAssignments_UserId",
                table: "SeeSpecAssignments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecBackends_TenantId_Slug",
                table: "SeeSpecBackends",
                columns: new[] { "TenantId", "Slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecBackends_TenantId_Status",
                table: "SeeSpecBackends",
                columns: new[] { "TenantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecDiagramElements_BackendId_DiagramType",
                table: "SeeSpecDiagramElements",
                columns: new[] { "BackendId", "DiagramType" });

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecDiagramElements_BackendId_ExternalElementKey",
                table: "SeeSpecDiagramElements",
                columns: new[] { "BackendId", "ExternalElementKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecDiagramElements_SpecSectionId",
                table: "SeeSpecDiagramElements",
                column: "SpecSectionId");

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecGenerationSnapshots_BackendId_Status",
                table: "SeeSpecGenerationSnapshots",
                columns: new[] { "BackendId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecGenerationSnapshots_TriggeredByUserId",
                table: "SeeSpecGenerationSnapshots",
                column: "TriggeredByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecNotes_AuthorUserId",
                table: "SeeSpecNotes",
                column: "AuthorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecNotes_BackendId",
                table: "SeeSpecNotes",
                column: "BackendId");

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecNotes_GenerationSnapshotId",
                table: "SeeSpecNotes",
                column: "GenerationSnapshotId");

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecNotes_TaskId",
                table: "SeeSpecNotes",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecSectionDependencies_FromSectionId_ToSectionId",
                table: "SeeSpecSectionDependencies",
                columns: new[] { "FromSectionId", "ToSectionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecSectionDependencies_ToSectionId",
                table: "SeeSpecSectionDependencies",
                column: "ToSectionId");

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecSectionItems_SpecSectionId_Position",
                table: "SeeSpecSectionItems",
                columns: new[] { "SpecSectionId", "Position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecSpecs_BackendId",
                table: "SeeSpecSpecs",
                column: "BackendId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecSpecSections_ParentSectionId",
                table: "SeeSpecSpecSections",
                column: "ParentSectionId");

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecSpecSections_SpecId_SectionType",
                table: "SeeSpecSpecSections",
                columns: new[] { "SpecId", "SectionType" });

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecSpecSections_SpecId_Slug",
                table: "SeeSpecSpecSections",
                columns: new[] { "SpecId", "Slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecTasks_AssignedToUserId",
                table: "SeeSpecTasks",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecTasks_BackendId_Status",
                table: "SeeSpecTasks",
                columns: new[] { "BackendId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecTasks_CreatedByUserId",
                table: "SeeSpecTasks",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecTasks_SpecSectionId",
                table: "SeeSpecTasks",
                column: "SpecSectionId");

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecTasks_TeamId",
                table: "SeeSpecTasks",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecTeams_BackendId_Name",
                table: "SeeSpecTeams",
                columns: new[] { "BackendId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecValidationResults_BackendId",
                table: "SeeSpecValidationResults",
                column: "BackendId");

            migrationBuilder.CreateIndex(
                name: "IX_SeeSpecValidationResults_GenerationSnapshotId",
                table: "SeeSpecValidationResults",
                column: "GenerationSnapshotId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SeeSpecAssignments");

            migrationBuilder.DropTable(
                name: "SeeSpecDiagramElements");

            migrationBuilder.DropTable(
                name: "SeeSpecNotes");

            migrationBuilder.DropTable(
                name: "SeeSpecSectionDependencies");

            migrationBuilder.DropTable(
                name: "SeeSpecSectionItems");

            migrationBuilder.DropTable(
                name: "SeeSpecValidationResults");

            migrationBuilder.DropTable(
                name: "SeeSpecTasks");

            migrationBuilder.DropTable(
                name: "SeeSpecGenerationSnapshots");

            migrationBuilder.DropTable(
                name: "SeeSpecSpecSections");

            migrationBuilder.DropTable(
                name: "SeeSpecTeams");

            migrationBuilder.DropTable(
                name: "SeeSpecSpecs");

            migrationBuilder.DropTable(
                name: "SeeSpecBackends");
        }
    }
}
