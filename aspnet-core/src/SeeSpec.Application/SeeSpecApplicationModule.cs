using Abp.AutoMapper;
using Abp.Modules;
using Abp.Reflection.Extensions;
using SeeSpec.Authorization;

namespace SeeSpec
{
    [DependsOn(
        typeof(SeeSpecCoreModule), 
        typeof(AbpAutoMapperModule))]
    public class SeeSpecApplicationModule : AbpModule
    {
        public override void PreInitialize()
        {
            Configuration.Authorization.Providers.Add<SeeSpecAuthorizationProvider>();
        }

        public override void Initialize()
        {
            var thisAssembly = typeof(SeeSpecApplicationModule).GetAssembly();

            IocManager.RegisterAssemblyByConvention(thisAssembly);

            Configuration.Modules.AbpAutoMapper().Configurators.Add(
                // Scan the assembly for classes which inherit from AutoMapper.Profile
                cfg => cfg.AddMaps(thisAssembly)
            );
        }
    }
}
