using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Abp.Domain.Entities.Auditing;

namespace SeeSpec.Domains.SpecManagement
{
    public class SpecSection : FullAuditedEntity<Guid>
    {
        public SpecSection()
        {
            ChildSections = new HashSet<SpecSection>();
            Items = new HashSet<SectionItem>();
            OutgoingDependencies = new HashSet<SectionDependency>();
            IncomingDependencies = new HashSet<SectionDependency>();
            DiagramElements = new HashSet<DiagramElement>();
        }

        public Guid SpecId { get; set; }

        [ForeignKey(nameof(SpecId))]
        public virtual Spec Spec { get; set; }

        public Guid? ParentSectionId { get; set; }

        [ForeignKey(nameof(ParentSectionId))]
        public virtual SpecSection ParentSection { get; set; }

        [Required]
        [StringLength(256)]
        public string Title { get; set; }

        [Required]
        [StringLength(128)]
        public string Slug { get; set; }

        public SectionType SectionType { get; set; }

        public int Order { get; set; }

        [StringLength(12000)]
        public string Content { get; set; }

        public SectionOwnerRole OwnerRole { get; set; }

        public int Version { get; set; }

        public virtual ICollection<SpecSection> ChildSections { get; set; }

        public virtual ICollection<SectionItem> Items { get; set; }

        public virtual ICollection<SectionDependency> OutgoingDependencies { get; set; }

        public virtual ICollection<SectionDependency> IncomingDependencies { get; set; }

        public virtual ICollection<DiagramElement> DiagramElements { get; set; }
    }
}
