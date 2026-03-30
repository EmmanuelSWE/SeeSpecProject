using System;
using System.ComponentModel.DataAnnotations;
using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using SeeSpec.Domains.ProjectManagement;

namespace SeeSpec.Services.TeamService.DTO
{
    [AutoMap(typeof(Team))]
    public class TeamDto : EntityDto<Guid>
    {
        public Guid BackendId { get; set; }

        [Required]
        [StringLength(128)]
        public string Name { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }
    }
}

