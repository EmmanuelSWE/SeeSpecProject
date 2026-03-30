using System;
using System.Collections.Generic;
using Abp.Application.Services.Dto;
using SeeSpec.Domains.SpecManagement;

namespace SeeSpec.Services.SpecService.DTO
{
    public class AssembledSpecDto : EntityDto<Guid>
    {
        public Guid BackendId { get; set; }

        public string Title { get; set; }

        public string Version { get; set; }

        public SpecStatus Status { get; set; }

        public IReadOnlyList<AssembledSpecSectionDto> Sections { get; set; }
    }
}
