using System;
using System.Collections.Generic;
using Abp.Application.Services.Dto;
using SeeSpec.Domains.SpecManagement;

namespace SeeSpec.Services.SpecService.DTO
{
    public class AssembledSpecSectionDto : EntityDto<Guid>
    {
        public string InputType { get; set; }

        public DiagramType? DiagramType { get; set; }

        public string Title { get; set; }

        public string Slug { get; set; }

        public SectionType SectionType { get; set; }

        public SectionOwnerRole OwnerRole { get; set; }

        public int Order { get; set; }

        public int Version { get; set; }

        public bool IsIndependent { get; set; }

        public IReadOnlyList<Guid> DependencySectionIds { get; set; }

        public IReadOnlyList<Guid> DependentSectionIds { get; set; }

        public IReadOnlyList<AssembledSectionItemDto> Items { get; set; }
    }
}
