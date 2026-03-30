using System;
using System.Linq;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using SeeSpec.Domains.ProjectManagement;
using SeeSpec.Services.BackendService.DTO;

namespace SeeSpec.Services.BackendService
{
    [AbpAuthorize]
    public class BackendAppService : AsyncCrudAppService<Backend, BackendDto, Guid, PagedAndSortedResultRequestDto, BackendDto, BackendDto>, IBackendAppService
    {
        public BackendAppService(IRepository<Backend, Guid> repository)
            : base(repository)
        {
        }

        protected override IQueryable<Backend> CreateFilteredQuery(PagedAndSortedResultRequestDto input)
        {
            var query = base.CreateFilteredQuery(input);

            if (AbpSession.TenantId.HasValue)
            {
                query = query.Where(x => x.TenantId == AbpSession.TenantId.Value);
            }

            return query;
        }
    }
}

