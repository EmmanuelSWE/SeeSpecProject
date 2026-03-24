using System.Threading.Tasks;
using Abp.Application.Services;
using SeeSpec.Sessions.Dto;

namespace SeeSpec.Sessions
{
    public interface ISessionAppService : IApplicationService
    {
        Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformations();
    }
}
