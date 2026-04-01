using System;
using System.ComponentModel.DataAnnotations;
using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using SeeSpec.Domains.CodingManagement;

namespace SeeSpec.Services.GenerationSnapshotService.DTO
{
    [AutoMap(typeof(GenerationSnapshot))]
    public class GenerationSnapshotDto : EntityDto<Guid>
    {
        public Guid BackendId { get; set; }

        public Guid? SpecId { get; set; }

        public long TriggeredByUserId { get; set; }

        public GenerationMode Mode { get; set; }

        public GenerationStatus Status { get; set; }

        [StringLength(2000)]
        public string Summary { get; set; }

        [StringLength(4000)]
        public string AffectedSectionIdsJson { get; set; }

        [StringLength(12000)]
        public string PromptSent { get; set; }

        [Required]
        [StringLength(128)]
        public string ModelName { get; set; }

        [StringLength(32000)]
        public string OutputText { get; set; }

        public DateTime CreationTime { get; set; }
    }
}

