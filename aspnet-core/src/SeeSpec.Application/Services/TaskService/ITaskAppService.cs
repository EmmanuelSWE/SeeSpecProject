using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using SeeSpec.Services.TaskService.DTO;

namespace SeeSpec.Services.TaskService
{
    public interface ITaskAppService : IAsyncCrudAppService<TaskDto, Guid, PagedAndSortedResultRequestDto, TaskDto, TaskDto>
    {
    }
}

