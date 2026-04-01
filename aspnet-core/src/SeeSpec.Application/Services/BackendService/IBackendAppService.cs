using System;
using System.Threading;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Microsoft.AspNetCore.Http;
using SeeSpec.Services.BackendService.DTO;

namespace SeeSpec.Services.BackendService
{
    public interface IBackendAppService : IAsyncCrudAppService<BackendDto, Guid, PagedAndSortedResultRequestDto, BackendDto, BackendDto>
    {
        Task<BackendUploadResultDto> UploadAsync(IFormFile file, CancellationToken cancellationToken);

        Task<BackendUploadResultDto> ImportFolderAsync(BackendFolderImportInputDto input, CancellationToken cancellationToken);
    }
}

