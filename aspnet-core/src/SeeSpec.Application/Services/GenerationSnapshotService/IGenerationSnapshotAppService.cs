using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using SeeSpec.Services.GenerationSnapshotService.DTO;

namespace SeeSpec.Services.GenerationSnapshotService
{
    public interface IGenerationSnapshotAppService : IAsyncCrudAppService<GenerationSnapshotDto, Guid, PagedAndSortedResultRequestDto, GenerationSnapshotDto, GenerationSnapshotDto>
    {
    }
}

