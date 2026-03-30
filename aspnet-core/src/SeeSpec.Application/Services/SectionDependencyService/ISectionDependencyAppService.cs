using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using SeeSpec.Services.SectionDependencyService.DTO;

namespace SeeSpec.Services.SectionDependencyService
{
    public interface ISectionDependencyAppService : IAsyncCrudAppService<SectionDependencyDto, Guid, PagedAndSortedResultRequestDto, SectionDependencyDto, SectionDependencyDto>
    {
    }
}

