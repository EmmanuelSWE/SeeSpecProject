using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Abp.Modules;
using Abp.Reflection.Extensions;
using SeeSpec.Configuration;

namespace SeeSpec.Web.Host.Startup
{
    [DependsOn(
       typeof(SeeSpecWebCoreModule))]
    public class SeeSpecWebHostModule: AbpModule
    {
        private readonly IWebHostEnvironment _env;
        private readonly IConfigurationRoot _appConfiguration;

        public SeeSpecWebHostModule(IWebHostEnvironment env)
        {
            _env = env;
            _appConfiguration = env.GetAppConfiguration();
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(SeeSpecWebHostModule).GetAssembly());
        }
    }
}
