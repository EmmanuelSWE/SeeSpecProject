using System.Threading.Tasks;
using Abp.Application.Services;
using SeeSpec.Authorization.Accounts.Dto;

namespace SeeSpec.Authorization.Accounts
{
    public interface IAccountAppService : IApplicationService
    {
        Task<ActiveTenantLoginOptionDto[]> GetActiveTenantsForLogin();

        Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input);

        Task<RegisterOutput> Register(RegisterInput input);
    }
}
