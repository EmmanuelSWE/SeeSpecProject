using System;
using Abp.Application.Services.Dto;
using Newtonsoft.Json.Linq;
using SeeSpec.Domains.SpecManagement;

namespace SeeSpec.Services.SpecService.DTO
{
    public class AssembledSectionItemDto : EntityDto<Guid>
    {
        public string Label { get; set; }

        public int Position { get; set; }

        public SectionItemType ItemType { get; set; }

        public JToken Content { get; set; }
    }
}
