using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Domain.Repositories;
using SeeSpec.Authorization;
using ProjectTask = SeeSpec.Domains.ProjectManagement.Task;
using SeeSpec.Services.TaskService.DTO;

namespace SeeSpec.Services.TaskService
{
    public class TaskAppService : AsyncCrudAppService<ProjectTask, TaskDto, Guid, PagedAndSortedResultRequestDto, TaskDto, TaskDto>, ITaskAppService
    {
        public TaskAppService(IRepository<ProjectTask, Guid> repository)
            : base(repository)
        {
            GetPermissionName = PermissionNames.Pages_Tasks;
            GetAllPermissionName = PermissionNames.Pages_Tasks;
            CreatePermissionName = PermissionNames.Pages_Tasks_Create;
            UpdatePermissionName = PermissionNames.Pages_Tasks_Edit;
            DeletePermissionName = PermissionNames.Pages_Tasks_Delete;
        }
    }
}

