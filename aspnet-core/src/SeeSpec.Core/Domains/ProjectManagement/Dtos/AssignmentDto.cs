using System;
using Abp.Application.Services.Dto;
using Abp.AutoMapper;

namespace SeeSpec.Domains.ProjectManagement.Dtos
{
    [AutoMapFrom(typeof(Assignment))]
    public class AssignmentDto : EntityDto<Guid>
    {
        public Guid BackendId { get; set; }

        public Guid? TeamId { get; set; }

        public long UserId { get; set; }

        public bool IsActive { get; set; }

        public DateTime JoinedAt { get; set; }
    }
}
