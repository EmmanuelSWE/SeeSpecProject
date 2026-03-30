using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Abp.Domain.Entities.Auditing;
using SeeSpec.Authorization.Users;
using SeeSpec.Domains.CodingManagement;

namespace SeeSpec.Domains.ProjectManagement
{
    public class Note : FullAuditedEntity<Guid>
    {
        public Guid BackendId { get; set; }

        [ForeignKey(nameof(BackendId))]
        public virtual Backend Backend { get; set; }

        public Guid? TaskId { get; set; }

        [ForeignKey(nameof(TaskId))]
        public virtual Task Task { get; set; }

        public Guid? GenerationSnapshotId { get; set; }

        [ForeignKey(nameof(GenerationSnapshotId))]
        public virtual GenerationSnapshot GenerationSnapshot { get; set; }

        public long AuthorUserId { get; set; }

        [ForeignKey(nameof(AuthorUserId))]
        public virtual User AuthorUser { get; set; }

        public NoteType NoteType { get; set; }

        [Required]
        [StringLength(4000)]
        public string Body { get; set; }

        [StringLength(1000)]
        public string OutcomeSummary { get; set; }
    }
}
