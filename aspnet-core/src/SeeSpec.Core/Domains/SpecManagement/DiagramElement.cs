using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Abp.Domain.Entities.Auditing;
using SeeSpec.Domains.ProjectManagement;

namespace SeeSpec.Domains.SpecManagement
{
    public class DiagramElement : FullAuditedEntity<Guid>
    {
        public Guid BackendId { get; set; }

        [ForeignKey(nameof(BackendId))]
        public virtual Backend Backend { get; set; }

        public Guid? SpecSectionId { get; set; }

        [ForeignKey(nameof(SpecSectionId))]
        public virtual SpecSection SpecSection { get; set; }

        public DiagramType DiagramType { get; set; }

        [Required]
        [StringLength(128)]
        public string ExternalElementKey { get; set; }

        [Required]
        [StringLength(256)]
        public string Name { get; set; }

        [StringLength(4000)]
        public string MetadataJson { get; set; }
    }
}
