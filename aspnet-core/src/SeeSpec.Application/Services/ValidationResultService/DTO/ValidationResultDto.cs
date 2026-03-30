using System;
using System.ComponentModel.DataAnnotations;
using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using CodingValidationResult = SeeSpec.Domains.CodingManagement.ValidationResult;

namespace SeeSpec.Services.ValidationResultService.DTO
{
    [AutoMap(typeof(CodingValidationResult))]
    public class ValidationResultDto : EntityDto<Guid>
    {
        public Guid BackendId { get; set; }

        public Guid? GenerationSnapshotId { get; set; }

        public bool Passed { get; set; }

        [StringLength(512)]
        public string GeneratedFilePath { get; set; }

        [StringLength(2000)]
        public string DiffSummary { get; set; }

        [StringLength(4000)]
        public string DetailsJson { get; set; }
    }
}

