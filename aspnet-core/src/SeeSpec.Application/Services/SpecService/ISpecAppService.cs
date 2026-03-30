using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using SeeSpec.Services.SpecService.DTO;

namespace SeeSpec.Services.SpecService
{
    public interface ISpecAppService : IAsyncCrudAppService<SpecDto, Guid, PagedAndSortedResultRequestDto, SpecDto, SpecDto>
    {
    }
}

