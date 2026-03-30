using System.Linq;
using System.Threading.Tasks;
using Abp.Configuration;
using Abp.Authorization;
using Abp.Zero.Configuration;
using SeeSpec.Authorization.Accounts.Dto;
using SeeSpec.Authorization.Users;
using Microsoft.EntityFrameworkCore;

namespace SeeSpec.Authorization.Accounts
{
    public class AccountAppService : SeeSpecAppServiceBase, IAccountAppService
    {
        // from: http://regexlib.com/REDetails.aspx?regexp_id=1923
        public const string PasswordRegex = "(?=^.{8,}$)(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\\s)[0-9a-zA-Z!@#$%^&*()]*$";

        private readonly UserRegistrationManager _userRegistrationManager;

        public AccountAppService(
            UserRegistrationManager userRegistrationManager)
        {
            _userRegistrationManager = userRegistrationManager;
        }

        [AbpAllowAnonymous]
        public async Task<ActiveTenantLoginOptionDto[]> GetActiveTenantsForLogin()
        {
            var tenants = await TenantManager.Tenants
                .Where(tenant => tenant.IsActive)
                .OrderBy(tenant => tenant.Name)
                .Select(tenant => new ActiveTenantLoginOptionDto
                {
                    Id = tenant.Id,
                    TenancyName = tenant.TenancyName,
                    Name = tenant.Name
                })
                .ToArrayAsync();

            return tenants;
        }

        [AbpAllowAnonymous]
        public async Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input)
        {
            var tenant = await TenantManager.FindByTenancyNameAsync(input.TenancyName);
            if (tenant == null)
            {
                return new IsTenantAvailableOutput(TenantAvailabilityState.NotFound);
            }

            if (!tenant.IsActive)
            {
                return new IsTenantAvailableOutput(TenantAvailabilityState.InActive);
            }

            return new IsTenantAvailableOutput(TenantAvailabilityState.Available, tenant.Id);
        }

        [AbpAllowAnonymous]
        public async Task<RegisterOutput> Register(RegisterInput input)
        {
            var user = await _userRegistrationManager.RegisterAsync(
                input.Name,
                input.Surname,
                input.EmailAddress,
                input.UserName,
                input.Password,
                true // Assumed email address is always confirmed. Change this if you want to implement email confirmation.
            );

            var isEmailConfirmationRequiredForLogin = await SettingManager.GetSettingValueAsync<bool>(AbpZeroSettingNames.UserManagement.IsEmailConfirmationRequiredForLogin);

            return new RegisterOutput
            {
                CanLogin = user.IsActive && (user.IsEmailConfirmed || !isEmailConfirmationRequiredForLogin)
            };
        }
    }
}
