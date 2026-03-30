using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using SeeSpec.Domains.ProjectManagement;
using SeeSpec.Services.AssignmentService.DTO;

namespace SeeSpec.Services.AssignmentService
{
    [AbpAuthorize]
    public class AssignmentAppService : AsyncCrudAppService<Assignment, AssignmentDto, Guid, PagedAndSortedResultRequestDto, AssignmentDto, AssignmentDto>, IAssignmentAppService
    {
        public AssignmentAppService(IRepository<Assignment, Guid> repository)
            : base(repository)
        {
        }
    }
}

