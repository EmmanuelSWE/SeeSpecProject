using System.Threading.Tasks;
using SeeSpec.Configuration.Dto;

namespace SeeSpec.Configuration
{
    public interface IConfigurationAppService
    {
        Task ChangeUiTheme(ChangeUiThemeInput input);
    }
}
