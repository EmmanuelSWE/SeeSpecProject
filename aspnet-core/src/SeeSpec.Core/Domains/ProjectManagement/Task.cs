using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Abp.Domain.Entities.Auditing;
using SeeSpec.Authorization.Users;
using SeeSpec.Domains.SpecManagement;

namespace SeeSpec.Domains.ProjectManagement
{
    public class Task : FullAuditedEntity<Guid>
    {
        public Guid BackendId { get; set; }

        [ForeignKey(nameof(BackendId))]
        public virtual Backend Backend { get; set; }

        [Required]
        [StringLength(256)]
        public string Title { get; set; }

        [StringLength(4000)]
        public string Description { get; set; }

        public TaskStatus Status { get; set; }

        public TaskPriority Priority { get; set; }

        public long CreatedByUserId { get; set; }

        [ForeignKey(nameof(CreatedByUserId))]
        public virtual User CreatedByUser { get; set; }

        public long? AssignedToUserId { get; set; }

        [ForeignKey(nameof(AssignedToUserId))]
        public virtual User AssignedToUser { get; set; }

        public Guid? TeamId { get; set; }

        [ForeignKey(nameof(TeamId))]
        public virtual Team Team { get; set; }

        public Guid? SpecSectionId { get; set; }

        [ForeignKey(nameof(SpecSectionId))]
        public virtual SpecSection SpecSection { get; set; }

        public DateTime? DueAt { get; set; }
    }
}
