using System.Threading;
using System.Threading.Tasks;
using Abp.UI;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SeeSpec.Services.BackendService;
using SeeSpec.Services.BackendService.DTO;

namespace SeeSpec.Controllers
{
    [Route("api/backends")]
    public class BackendsController : SeeSpecControllerBase
    {
        private readonly IBackendImportService _backendImportService;

        public BackendsController(IBackendImportService backendImportService)
        {
            _backendImportService = backendImportService;
        }

        [HttpPost("upload")]
        public async Task<ActionResult<BackendUploadResultDto>> Upload([FromForm] IFormFile file, CancellationToken cancellationToken)
        {
            if (file == null || file.Length == 0)
            {
                throw new UserFriendlyException("A backend archive file is required.");
            }

            using (var readStream = file.OpenReadStream())
            {
                return Ok(await _backendImportService.ImportArchiveAsync(readStream, file.FileName, cancellationToken));
            }
        }

        [HttpPost("import-folder")]
        public async Task<ActionResult<BackendUploadResultDto>> ImportFolder([FromBody] BackendFolderImportInputDto input, CancellationToken cancellationToken)
        {
            if (input == null || string.IsNullOrWhiteSpace(input.FolderPath))
            {
                throw new UserFriendlyException("A backend folder path is required.");
            }

            return Ok(await _backendImportService.ImportFolderAsync(input.FolderPath, cancellationToken));
        }
    }
}
