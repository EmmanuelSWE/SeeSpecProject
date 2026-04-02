using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Domain.Repositories;
using SeeSpec.Authorization;
using SeeSpec.Domains.ProjectManagement;
using SeeSpec.Services.AssignmentService.DTO;

namespace SeeSpec.Services.AssignmentService
{
    public class AssignmentAppService : AsyncCrudAppService<Assignment, AssignmentDto, Guid, PagedAndSortedResultRequestDto, AssignmentDto, AssignmentDto>, IAssignmentAppService
    {
        public AssignmentAppService(IRepository<Assignment, Guid> repository)
            : base(repository)
        {
            GetPermissionName = PermissionNames.Pages_Assignments;
            GetAllPermissionName = PermissionNames.Pages_Assignments;
            CreatePermissionName = PermissionNames.Pages_Assignments_Create;
            UpdatePermissionName = PermissionNames.Pages_Assignments_Edit;
            DeletePermissionName = PermissionNames.Pages_Assignments_Delete;
        }
    }
}

