using System;
using Abp.Application.Services.Dto;
using Abp.AutoMapper;

namespace SeeSpec.Domains.SpecManagement.Dtos
{
    [AutoMapFrom(typeof(SectionDependency))]
    public class SectionDependencyDto : EntityDto<Guid>
    {
        public Guid FromSectionId { get; set; }

        public Guid ToSectionId { get; set; }

        public SectionDependencyType DependencyType { get; set; }
    }
}
