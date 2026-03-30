using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Abp.Domain.Entities.Auditing;

namespace SeeSpec.Domains.ProjectManagement
{
    public class Team : FullAuditedEntity<Guid>
    {
        public Team()
        {
            Assignments = new HashSet<Assignment>();
            Tasks = new HashSet<Task>();
        }

        public Guid BackendId { get; set; }

        [ForeignKey(nameof(BackendId))]
        public virtual Backend Backend { get; set; }

        [Required]
        [StringLength(128)]
        public string Name { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }

        public virtual ICollection<Assignment> Assignments { get; set; }

        public virtual ICollection<Task> Tasks { get; set; }
    }
}
