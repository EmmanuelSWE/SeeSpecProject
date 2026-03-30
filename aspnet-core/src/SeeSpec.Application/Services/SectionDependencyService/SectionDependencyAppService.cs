using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using SeeSpec.Domains.SpecManagement;
using SeeSpec.Services.SectionDependencyService.DTO;

namespace SeeSpec.Services.SectionDependencyService
{
    [AbpAuthorize]
    public class SectionDependencyAppService : AsyncCrudAppService<SectionDependency, SectionDependencyDto, Guid, PagedAndSortedResultRequestDto, SectionDependencyDto, SectionDependencyDto>, ISectionDependencyAppService
    {
        public SectionDependencyAppService(IRepository<SectionDependency, Guid> repository)
            : base(repository)
        {
        }
    }
}

