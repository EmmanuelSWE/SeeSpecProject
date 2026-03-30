using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Abp.Domain.Entities.Auditing;
using SeeSpec.Domains.ProjectManagement;

namespace SeeSpec.Domains.CodingManagement
{
    public class ValidationResult : FullAuditedEntity<Guid>
    {
        public Guid BackendId { get; set; }

        [ForeignKey(nameof(BackendId))]
        public virtual Backend Backend { get; set; }

        public Guid? GenerationSnapshotId { get; set; }

        [ForeignKey(nameof(GenerationSnapshotId))]
        public virtual GenerationSnapshot GenerationSnapshot { get; set; }

        public bool Passed { get; set; }

        [StringLength(512)]
        public string GeneratedFilePath { get; set; }

        [StringLength(2000)]
        public string DiffSummary { get; set; }

        [StringLength(4000)]
        public string DetailsJson { get; set; }
    }
}
