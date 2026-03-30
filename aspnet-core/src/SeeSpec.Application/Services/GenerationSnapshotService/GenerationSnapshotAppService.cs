using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using SeeSpec.Domains.CodingManagement;
using SeeSpec.Services.GenerationSnapshotService.DTO;

namespace SeeSpec.Services.GenerationSnapshotService
{
    [AbpAuthorize]
    public class GenerationSnapshotAppService : AsyncCrudAppService<GenerationSnapshot, GenerationSnapshotDto, Guid, PagedAndSortedResultRequestDto, GenerationSnapshotDto, GenerationSnapshotDto>, IGenerationSnapshotAppService
    {
        public GenerationSnapshotAppService(IRepository<GenerationSnapshot, Guid> repository)
            : base(repository)
        {
        }
    }
}

