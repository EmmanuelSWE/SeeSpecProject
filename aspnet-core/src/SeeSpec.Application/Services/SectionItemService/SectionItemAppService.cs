using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using SeeSpec.Domains.SpecManagement;
using SeeSpec.Services.SectionItemService.DTO;

namespace SeeSpec.Services.SectionItemService
{
    [AbpAuthorize]
    public class SectionItemAppService : AsyncCrudAppService<SectionItem, SectionItemDto, Guid, PagedAndSortedResultRequestDto, SectionItemDto, SectionItemDto>, ISectionItemAppService
    {
        public SectionItemAppService(IRepository<SectionItem, Guid> repository)
            : base(repository)
        {
        }
    }
}

