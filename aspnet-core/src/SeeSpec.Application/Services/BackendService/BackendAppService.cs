using System;
using System.Linq;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using SeeSpec.Domains.ProjectManagement;
using SeeSpec.Services.BackendService.DTO;
using SeeSpec.Services.SpecService;

namespace SeeSpec.Services.BackendService
{
    [AbpAuthorize]
    public class BackendAppService : AsyncCrudAppService<Backend, BackendDto, Guid, PagedAndSortedResultRequestDto, BackendDto, BackendDto>, IBackendAppService
    {
        private readonly ISpecAppService _specAppService;

        public BackendAppService(IRepository<Backend, Guid> repository, ISpecAppService specAppService)
            : base(repository)
        {
            _specAppService = specAppService;
        }

        public override async System.Threading.Tasks.Task<BackendDto> CreateAsync(BackendDto input)
        {
            BackendDto backend = await base.CreateAsync(input);

            // Manual backend creation must follow the same canonical flow as imports so later
            // requirement and diagram saves always have a valid Spec -> SpecSection -> SectionItem home.
            await _specAppService.EnsureCanonicalStructureAsync(new EntityDto<Guid>(backend.Id));

            return backend;
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

