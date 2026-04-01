using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
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

        public override System.Threading.Tasks.Task<GenerationSnapshotDto> UpdateAsync(GenerationSnapshotDto input)
        {
            // Snapshots are append-only trace records and must remain immutable once written.
            throw new UserFriendlyException("Generation snapshots are immutable and cannot be updated.");
        }

        public override System.Threading.Tasks.Task DeleteAsync(EntityDto<Guid> input)
        {
            throw new UserFriendlyException("Generation snapshots are immutable and cannot be deleted.");
        }
    }
}

