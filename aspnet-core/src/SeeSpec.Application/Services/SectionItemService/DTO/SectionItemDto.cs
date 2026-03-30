using System;
using System.ComponentModel.DataAnnotations;
using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using SeeSpec.Domains.SpecManagement;

namespace SeeSpec.Services.SectionItemService.DTO
{
    [AutoMap(typeof(SectionItem))]
    public class SectionItemDto : EntityDto<Guid>
    {
        public Guid SpecSectionId { get; set; }

        [Required]
        [StringLength(256)]
        public string Label { get; set; }

        [StringLength(4000)]
        public string Content { get; set; }

        public int Position { get; set; }

        public SectionItemType ItemType { get; set; }
    }
}

