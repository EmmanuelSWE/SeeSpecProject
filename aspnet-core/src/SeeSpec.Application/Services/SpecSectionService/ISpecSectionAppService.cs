using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using SeeSpec.Services.SpecSectionService.DTO;

namespace SeeSpec.Services.SpecSectionService
{
    public interface ISpecSectionAppService : IAsyncCrudAppService<SpecSectionDto, Guid, PagedAndSortedResultRequestDto, SpecSectionDto, SpecSectionDto>
    {
    }
}

