using System;
using System.ComponentModel.DataAnnotations.Schema;
using Abp.Domain.Entities.Auditing;

namespace SeeSpec.Domains.SpecManagement
{
    public class SectionDependency : FullAuditedEntity<Guid>
    {
        public Guid FromSectionId { get; set; }

        [ForeignKey(nameof(FromSectionId))]
        public virtual SpecSection FromSection { get; set; }

        public Guid ToSectionId { get; set; }

        [ForeignKey(nameof(ToSectionId))]
        public virtual SpecSection ToSection { get; set; }

        public SectionDependencyType DependencyType { get; set; }
    }
}
