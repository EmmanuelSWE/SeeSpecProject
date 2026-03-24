using System.Threading.Tasks;
using Abp.Authorization;
using Abp.Runtime.Session;
using SeeSpec.Configuration.Dto;

namespace SeeSpec.Configuration
{
    [AbpAuthorize]
    public class ConfigurationAppService : SeeSpecAppServiceBase, IConfigurationAppService
    {
        public async Task ChangeUiTheme(ChangeUiThemeInput input)
        {
            await SettingManager.ChangeSettingForUserAsync(AbpSession.ToUserIdentifier(), AppSettingNames.UiTheme, input.Theme);
        }
    }
}
