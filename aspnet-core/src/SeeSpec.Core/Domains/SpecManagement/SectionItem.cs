using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Abp.Domain.Entities.Auditing;

namespace SeeSpec.Domains.SpecManagement
{
    public class SectionItem : FullAuditedEntity<Guid>
    {
        public Guid SpecSectionId { get; set; }

        [ForeignKey(nameof(SpecSectionId))]
        public virtual SpecSection SpecSection { get; set; }

        [Required]
        [StringLength(256)]
        public string Label { get; set; }

        [StringLength(4000)]
        public string Content { get; set; }

        public int Position { get; set; }

        public SectionItemType ItemType { get; set; }
    }
}
