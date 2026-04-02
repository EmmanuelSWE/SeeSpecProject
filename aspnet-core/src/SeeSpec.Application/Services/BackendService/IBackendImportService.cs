using System.IO;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SeeSpec.Services.BackendService.DTO;

namespace SeeSpec.Services.BackendService
{
    public interface IBackendImportService
    {
        Task<BackendUploadResultDto> ImportArchiveAsync(Stream fileStream, string fileName, CancellationToken cancellationToken);

        Task<BackendUploadResultDto> ImportFolderAsync(string folderPath, CancellationToken cancellationToken);

        Task<List<AllowedGenerationFolderDto>> GetAllowedGenerationFoldersAsync(GetAllowedGenerationFoldersInputDto input, CancellationToken cancellationToken);

        Task<AllowedGenerationFolderDto> ValidateGenerationFolderAsync(ValidateGenerationFolderInputDto input, CancellationToken cancellationToken);
    }
}
