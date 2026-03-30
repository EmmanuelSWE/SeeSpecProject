using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Abp.Auditing;
using Abp.Authorization;
using SeeSpec.Authorization.Users;
using SeeSpec.Sessions.Dto;

namespace SeeSpec.Sessions
{
    public class SessionAppService : SeeSpecAppServiceBase, ISessionAppService
    {
        private readonly UserManager _userManager;

        public SessionAppService(UserManager userManager)
        {
            _userManager = userManager;
        }

        [DisableAuditing]
        public async Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformations()
        {
            var output = new GetCurrentLoginInformationsOutput
            {
                Application = new ApplicationInfoDto
                {
                    Version = AppVersionHelper.Version,
                    ReleaseDate = AppVersionHelper.ReleaseDate,
                    Features = new Dictionary<string, bool>()
                }
            };

            if (AbpSession.TenantId.HasValue)
            {
                output.Tenant = ObjectMapper.Map<TenantLoginInfoDto>(await GetCurrentTenantAsync());
            }

            if (AbpSession.UserId.HasValue)
            {
                var currentUser = await GetCurrentUserAsync();
                var userDto = ObjectMapper.Map<UserLoginInfoDto>(currentUser);

                userDto.RoleNames = (await _userManager.GetRolesAsync(currentUser)).ToArray();
                var allPermissions = PermissionManager.GetAllPermissions();
                var grantedPermissions = new List<string>();

                foreach (var permission in allPermissions)
                {
                    if (await PermissionChecker.IsGrantedAsync(permission.Name))
                    {
                        grantedPermissions.Add(permission.Name);
                    }
                }

                userDto.GrantedPermissions = grantedPermissions.ToArray();

                output.User = userDto;
            }

            return output;
        }
    }
}
