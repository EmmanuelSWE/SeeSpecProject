using Microsoft.EntityFrameworkCore;
using Abp.Zero.EntityFrameworkCore;
using SeeSpec.Authorization.Roles;
using SeeSpec.Authorization.Users;
using SeeSpec.Domains.CodingManagement;
using SeeSpec.Domains.ProjectManagement;
using SeeSpec.Domains.SpecManagement;
using SeeSpec.MultiTenancy;

namespace SeeSpec.EntityFrameworkCore
{
    public class SeeSpecDbContext : AbpZeroDbContext<Tenant, Role, User, SeeSpecDbContext>
    {
        public DbSet<Backend> Backends { get; set; }

        public DbSet<Team> Teams { get; set; }

        public DbSet<Assignment> Assignments { get; set; }

        public DbSet<Task> Tasks { get; set; }

        public DbSet<Note> Notes { get; set; }

        public DbSet<Spec> Specs { get; set; }

        public DbSet<SpecSection> SpecSections { get; set; }

        public DbSet<SectionItem> SectionItems { get; set; }

        public DbSet<SectionDependency> SectionDependencies { get; set; }

        public DbSet<DiagramElement> DiagramElements { get; set; }

        public DbSet<GenerationSnapshot> GenerationSnapshots { get; set; }

        public DbSet<ValidationResult> ValidationResults { get; set; }

        public SeeSpecDbContext(DbContextOptions<SeeSpecDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Backend>(entity =>
            {
                entity.ToTable("SeeSpecBackends");
                entity.HasIndex(x => new { x.TenantId, x.Slug }).IsUnique();
                entity.HasIndex(x => new { x.TenantId, x.Status });
                entity.Property(x => x.Status).HasConversion<int>();
            });

            modelBuilder.Entity<Team>(entity =>
            {
                entity.ToTable("SeeSpecTeams");
                entity.HasIndex(x => new { x.BackendId, x.Name }).IsUnique();
                entity.HasOne(x => x.Backend)
                    .WithMany(x => x.Teams)
                    .HasForeignKey(x => x.BackendId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Assignment>(entity =>
            {
                entity.ToTable("SeeSpecAssignments");
                entity.HasIndex(x => new { x.BackendId, x.UserId }).IsUnique();
                entity.HasIndex(x => new { x.TeamId, x.IsActive });
                entity.HasOne(x => x.Backend)
                    .WithMany(x => x.Assignments)
                    .HasForeignKey(x => x.BackendId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(x => x.Team)
                    .WithMany(x => x.Assignments)
                    .HasForeignKey(x => x.TeamId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(x => x.User)
                    .WithMany()
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Task>(entity =>
            {
                entity.ToTable("SeeSpecTasks");
                entity.HasIndex(x => new { x.BackendId, x.Status });
                entity.HasIndex(x => x.AssignedToUserId);
                entity.HasIndex(x => x.SpecSectionId);
                entity.Property(x => x.Status).HasConversion<int>();
                entity.Property(x => x.Priority).HasConversion<int>();
                entity.HasOne(x => x.Backend)
                    .WithMany(x => x.Tasks)
                    .HasForeignKey(x => x.BackendId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(x => x.Team)
                    .WithMany(x => x.Tasks)
                    .HasForeignKey(x => x.TeamId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(x => x.CreatedByUser)
                    .WithMany()
                    .HasForeignKey(x => x.CreatedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(x => x.AssignedToUser)
                    .WithMany()
                    .HasForeignKey(x => x.AssignedToUserId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(x => x.SpecSection)
                    .WithMany()
                    .HasForeignKey(x => x.SpecSectionId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Note>(entity =>
            {
                entity.ToTable("SeeSpecNotes");
                entity.HasIndex(x => x.BackendId);
                entity.HasIndex(x => x.TaskId);
                entity.HasIndex(x => x.GenerationSnapshotId);
                entity.Property(x => x.NoteType).HasConversion<int>();
                entity.HasOne(x => x.Backend)
                    .WithMany(x => x.Notes)
                    .HasForeignKey(x => x.BackendId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(x => x.Task)
                    .WithMany()
                    .HasForeignKey(x => x.TaskId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(x => x.GenerationSnapshot)
                    .WithMany(x => x.Notes)
                    .HasForeignKey(x => x.GenerationSnapshotId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(x => x.AuthorUser)
                    .WithMany()
                    .HasForeignKey(x => x.AuthorUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Spec>(entity =>
            {
                entity.ToTable("SeeSpecSpecs");
                entity.HasIndex(x => x.BackendId).IsUnique();
                entity.Property(x => x.Status).HasConversion<int>();
                entity.HasOne(x => x.Backend)
                    .WithOne(x => x.Spec)
                    .HasForeignKey<Spec>(x => x.BackendId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<SpecSection>(entity =>
            {
                entity.ToTable("SeeSpecSpecSections");
                entity.HasIndex(x => new { x.SpecId, x.Slug }).IsUnique();
                entity.HasIndex(x => new { x.SpecId, x.SectionType });
                entity.Property(x => x.SectionType).HasConversion<int>();
                entity.Property(x => x.OwnerRole).HasConversion<int>();
                entity.HasOne(x => x.Spec)
                    .WithMany(x => x.Sections)
                    .HasForeignKey(x => x.SpecId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(x => x.ParentSection)
                    .WithMany(x => x.ChildSections)
                    .HasForeignKey(x => x.ParentSectionId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<SectionItem>(entity =>
            {
                entity.ToTable("SeeSpecSectionItems");
                entity.HasIndex(x => new { x.SpecSectionId, x.Position }).IsUnique();
                entity.Property(x => x.ItemType).HasConversion<int>();
                entity.HasOne(x => x.SpecSection)
                    .WithMany(x => x.Items)
                    .HasForeignKey(x => x.SpecSectionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<SectionDependency>(entity =>
            {
                entity.ToTable("SeeSpecSectionDependencies");
                entity.HasIndex(x => new { x.FromSectionId, x.ToSectionId }).IsUnique();
                entity.Property(x => x.DependencyType).HasConversion<int>();
                entity.HasOne(x => x.FromSection)
                    .WithMany(x => x.OutgoingDependencies)
                    .HasForeignKey(x => x.FromSectionId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(x => x.ToSection)
                    .WithMany(x => x.IncomingDependencies)
                    .HasForeignKey(x => x.ToSectionId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<DiagramElement>(entity =>
            {
                entity.ToTable("SeeSpecDiagramElements");
                entity.HasIndex(x => new { x.BackendId, x.DiagramType });
                entity.HasIndex(x => new { x.BackendId, x.ExternalElementKey }).IsUnique();
                entity.Property(x => x.DiagramType).HasConversion<int>();
                entity.HasOne(x => x.Backend)
                    .WithMany(x => x.DiagramElements)
                    .HasForeignKey(x => x.BackendId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(x => x.SpecSection)
                    .WithMany(x => x.DiagramElements)
                    .HasForeignKey(x => x.SpecSectionId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<GenerationSnapshot>(entity =>
            {
                entity.ToTable("SeeSpecGenerationSnapshots");
                entity.HasIndex(x => new { x.BackendId, x.Status });
                entity.HasIndex(x => x.SpecId);
                entity.Property(x => x.Mode).HasConversion<int>();
                entity.Property(x => x.Status).HasConversion<int>();
                entity.HasOne(x => x.Backend)
                    .WithMany(x => x.GenerationSnapshots)
                    .HasForeignKey(x => x.BackendId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(x => x.Spec)
                    .WithMany()
                    .HasForeignKey(x => x.SpecId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(x => x.TriggeredByUser)
                    .WithMany()
                    .HasForeignKey(x => x.TriggeredByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ValidationResult>(entity =>
            {
                entity.ToTable("SeeSpecValidationResults");
                entity.HasIndex(x => x.BackendId);
                entity.HasIndex(x => x.GenerationSnapshotId);
                entity.HasOne(x => x.Backend)
                    .WithMany(x => x.ValidationResults)
                    .HasForeignKey(x => x.BackendId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(x => x.GenerationSnapshot)
                    .WithMany(x => x.ValidationResults)
                    .HasForeignKey(x => x.GenerationSnapshotId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
