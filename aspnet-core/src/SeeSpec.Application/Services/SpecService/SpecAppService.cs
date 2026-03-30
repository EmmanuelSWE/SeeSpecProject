using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using SeeSpec.Domains.SpecManagement;
using SeeSpec.Services.SpecService.DTO;

namespace SeeSpec.Services.SpecService
{
    [AbpAuthorize]
    public class SpecAppService : AsyncCrudAppService<Spec, SpecDto, Guid, PagedAndSortedResultRequestDto, SpecDto, SpecDto>, ISpecAppService
    {
        public SpecAppService(IRepository<Spec, Guid> repository)
            : base(repository)
        {
        }
    }
}

