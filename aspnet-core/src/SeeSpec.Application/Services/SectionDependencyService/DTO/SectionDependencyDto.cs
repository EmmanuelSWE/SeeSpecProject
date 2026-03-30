using System;
using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using SeeSpec.Domains.SpecManagement;

namespace SeeSpec.Services.SectionDependencyService.DTO
{
    [AutoMap(typeof(SectionDependency))]
    public class SectionDependencyDto : EntityDto<Guid>
    {
        public Guid FromSectionId { get; set; }

        public Guid ToSectionId { get; set; }

        public SectionDependencyType DependencyType { get; set; }
    }
}

