using System.Threading.Tasks;
using Abp;
using Abp.Authorization;
using Abp.Dependency;

namespace SeeSpec.Authorization
{
    // Authorization is intentionally disabled during the unrestricted-access pass.
    // Keep the custom permission checker aligned so explicit service checks also allow all calls.
    public class PermissionChecker : IPermissionChecker, ITransientDependency
    {
        public Task<bool> IsGrantedAsync(string permissionName)
        {
            return Task.FromResult(true);
        }

        public bool IsGranted(string permissionName)
        {
            return true;
        }

        public Task<bool> IsGrantedAsync(UserIdentifier user, string permissionName)
        {
            return Task.FromResult(true);
        }

        public bool IsGranted(UserIdentifier user, string permissionName)
        {
            return true;
        }
    }
}
