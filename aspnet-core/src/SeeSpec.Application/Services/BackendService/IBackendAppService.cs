using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using SeeSpec.Services.BackendService.DTO;

namespace SeeSpec.Services.BackendService
{
    public interface IBackendAppService : IAsyncCrudAppService<BackendDto, Guid, PagedAndSortedResultRequestDto, BackendDto, BackendDto>
    {
    }
}

