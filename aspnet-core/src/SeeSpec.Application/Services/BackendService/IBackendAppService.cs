using System;
using System.Threading;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Collections.Extensions;
using Microsoft.AspNetCore.Http;
using SeeSpec.Services.BackendService.DTO;

namespace SeeSpec.Services.BackendService
{
    public interface IBackendAppService : IAsyncCrudAppService<BackendDto, Guid, PagedAndSortedResultRequestDto, BackendDto, BackendDto>
    {
        Task<BackendDto> GetBySlugAsync(GetBackendBySlugInputDto input);

        Task<BackendWorkflowReadinessDto> GetWorkflowReadinessAsync(GetBackendWorkflowReadinessInputDto input);

        Task<BackendUploadResultDto> UploadAsync(IFormFile file, CancellationToken cancellationToken);

        Task<BackendUploadResultDto> ImportFolderAsync(BackendFolderImportInputDto input, CancellationToken cancellationToken);

        Task<ListResultDto<AllowedGenerationFolderDto>> GetAllowedGenerationFoldersAsync(GetAllowedGenerationFoldersInputDto input, CancellationToken cancellationToken);

        Task<AllowedGenerationFolderDto> ValidateGenerationFolderAsync(ValidateGenerationFolderInputDto input, CancellationToken cancellationToken);
    }
}

