using Abp.AspNetCore.Mvc.Controllers;
using Abp.IdentityFramework;
using Microsoft.AspNetCore.Identity;

namespace SeeSpec.Controllers
{
    public abstract class SeeSpecControllerBase: AbpController
    {
        protected SeeSpecControllerBase()
        {
            LocalizationSourceName = SeeSpecConsts.LocalizationSourceName;
        }

        protected void CheckErrors(IdentityResult identityResult)
        {
            identityResult.CheckErrors(LocalizationManager);
        }
    }
}
