using Abp.Authorization;
using SeeSpec.Authorization.Roles;
using SeeSpec.Authorization.Users;

namespace SeeSpec.Authorization
{
    public class PermissionChecker : PermissionChecker<Role, User>
    {
        public PermissionChecker(UserManager userManager)
            : base(userManager)
        {
        }
    }
}
