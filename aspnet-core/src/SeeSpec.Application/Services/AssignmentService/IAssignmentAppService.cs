using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using SeeSpec.Services.AssignmentService.DTO;

namespace SeeSpec.Services.AssignmentService
{
    public interface IAssignmentAppService : IAsyncCrudAppService<AssignmentDto, Guid, PagedAndSortedResultRequestDto, AssignmentDto, AssignmentDto>
    {
    }
}

