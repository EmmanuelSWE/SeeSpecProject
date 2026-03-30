using System;
using System.ComponentModel.DataAnnotations;
using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using SeeSpec.Domains.SpecManagement;

namespace SeeSpec.Services.SpecService.DTO
{
    [AutoMap(typeof(Spec))]
    public class SpecDto : EntityDto<Guid>
    {
        public Guid BackendId { get; set; }

        [Required]
        [StringLength(256)]
        public string Title { get; set; }

        [Required]
        [StringLength(32)]
        public string Version { get; set; }

        public SpecStatus Status { get; set; }
    }
}

