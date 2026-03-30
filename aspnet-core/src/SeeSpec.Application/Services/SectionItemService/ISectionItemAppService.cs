using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using SeeSpec.Services.SectionItemService.DTO;

namespace SeeSpec.Services.SectionItemService
{
    public interface ISectionItemAppService : IAsyncCrudAppService<SectionItemDto, Guid, PagedAndSortedResultRequestDto, SectionItemDto, SectionItemDto>
    {
    }
}

