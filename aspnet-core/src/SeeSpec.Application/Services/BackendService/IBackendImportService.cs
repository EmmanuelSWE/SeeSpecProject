using System.IO;
using System.Threading;
using System.Threading.Tasks;
using SeeSpec.Services.BackendService.DTO;

namespace SeeSpec.Services.BackendService
{
    public interface IBackendImportService
    {
        Task<BackendUploadResultDto> ImportArchiveAsync(Stream fileStream, string fileName, CancellationToken cancellationToken);
    }
}
