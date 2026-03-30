using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using ProjectTask = SeeSpec.Domains.ProjectManagement.Task;
using SeeSpec.Services.TaskService.DTO;

namespace SeeSpec.Services.TaskService
{
    [AbpAuthorize]
    public class TaskAppService : AsyncCrudAppService<ProjectTask, TaskDto, Guid, PagedAndSortedResultRequestDto, TaskDto, TaskDto>, ITaskAppService
    {
        public TaskAppService(IRepository<ProjectTask, Guid> repository)
            : base(repository)
        {
        }
    }
}

