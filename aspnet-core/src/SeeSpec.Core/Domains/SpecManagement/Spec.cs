using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Abp.Domain.Entities.Auditing;
using SeeSpec.Domains.ProjectManagement;

namespace SeeSpec.Domains.SpecManagement
{
    public class Spec : FullAuditedEntity<Guid>
    {
        public Spec()
        {
            Sections = new HashSet<SpecSection>();
        }

        public Guid BackendId { get; set; }

        [ForeignKey(nameof(BackendId))]
        public virtual Backend Backend { get; set; }

        [Required]
        [StringLength(256)]
        public string Title { get; set; }

        [Required]
        [StringLength(32)]
        public string Version { get; set; }

        public SpecStatus Status { get; set; }

        public virtual ICollection<SpecSection> Sections { get; set; }
    }
}
