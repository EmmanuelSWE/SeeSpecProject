using System;
using System.ComponentModel.DataAnnotations;
using Abp.Application.Services.Dto;
using Abp.AutoMapper;

namespace SeeSpec.Domains.SpecManagement.Dtos
{
    [AutoMapFrom(typeof(SpecSection))]
    public class SpecSectionDto : EntityDto<Guid>
    {
        public Guid SpecId { get; set; }

        public Guid? ParentSectionId { get; set; }

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
    }
}
