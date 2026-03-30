using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Abp.Domain.Entities.Auditing;
using SeeSpec.Authorization.Users;
using SeeSpec.Domains.ProjectManagement;

namespace SeeSpec.Domains.CodingManagement
{
    public class GenerationSnapshot : FullAuditedEntity<Guid>
    {
        public GenerationSnapshot()
        {
            Notes = new HashSet<Note>();
            ValidationResults = new HashSet<ValidationResult>();
        }

        public Guid BackendId { get; set; }

        [ForeignKey(nameof(BackendId))]
        public virtual Backend Backend { get; set; }

        public long TriggeredByUserId { get; set; }

        [ForeignKey(nameof(TriggeredByUserId))]
        public virtual User TriggeredByUser { get; set; }

        public GenerationMode Mode { get; set; }

        public GenerationStatus Status { get; set; }

        [StringLength(2000)]
        public string Summary { get; set; }

        [StringLength(4000)]
        public string AffectedSectionIdsJson { get; set; }

        [StringLength(12000)]
        public string PromptSent { get; set; }

        public virtual ICollection<Note> Notes { get; set; }

        public virtual ICollection<ValidationResult> ValidationResults { get; set; }
    }
}
