using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SeeSpec.Services.BackendService;
using SeeSpec.Services.BackendService.DTO;

namespace SeeSpec.Controllers
{
    [Route("api/backends")]
    public class BackendsController : SeeSpecControllerBase
    {
        private readonly IBackendAppService _backendAppService;

        public BackendsController(IBackendAppService backendAppService)
        {
            _backendAppService = backendAppService;
        }

      
    }
}
