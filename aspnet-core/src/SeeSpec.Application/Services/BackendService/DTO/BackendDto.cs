using System;
using System.ComponentModel.DataAnnotations;
using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using SeeSpec.Domains.ProjectManagement;

namespace SeeSpec.Services.BackendService.DTO
{
    [AutoMap(typeof(Backend))]
    public class BackendDto : EntityDto<Guid>
    {
        public int TenantId { get; set; }

        [Required]
        [StringLength(128)]
        public string Name { get; set; }

        [Required]
        [StringLength(128)]
        public string Slug { get; set; }

        [Required]
        [StringLength(64)]
        public string Framework { get; set; }

        [StringLength(32)]
        public string RuntimeVersion { get; set; }

        [StringLength(2000)]
        public string Description { get; set; }

        public BackendStatus Status { get; set; }

        [StringLength(512)]
        public string RepositoryUrl { get; set; }
    }
}

