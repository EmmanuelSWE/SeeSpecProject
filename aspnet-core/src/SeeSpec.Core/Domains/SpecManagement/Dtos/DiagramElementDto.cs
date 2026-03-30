using System;
using System.ComponentModel.DataAnnotations;
using Abp.Application.Services.Dto;
using Abp.AutoMapper;

namespace SeeSpec.Domains.SpecManagement.Dtos
{
    [AutoMapFrom(typeof(DiagramElement))]
    public class DiagramElementDto : EntityDto<Guid>
    {
        public Guid BackendId { get; set; }

        public Guid? SpecSectionId { get; set; }

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
