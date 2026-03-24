using Abp.AspNetCore;
using Abp.AspNetCore.TestBase;
using Abp.Modules;
using Abp.Reflection.Extensions;
using SeeSpec.EntityFrameworkCore;
using SeeSpec.Web.Startup;
using Microsoft.AspNetCore.Mvc.ApplicationParts;

namespace SeeSpec.Web.Tests
{
    [DependsOn(
        typeof(SeeSpecWebMvcModule),
        typeof(AbpAspNetCoreTestBaseModule)
    )]
    public class SeeSpecWebTestModule : AbpModule
    {
        public SeeSpecWebTestModule(SeeSpecEntityFrameworkModule abpProjectNameEntityFrameworkModule)
        {
            abpProjectNameEntityFrameworkModule.SkipDbContextRegistration = true;
        } 
        
        public override void PreInitialize()
        {
            Configuration.UnitOfWork.IsTransactional = false; //EF Core InMemory DB does not support transactions.
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(SeeSpecWebTestModule).GetAssembly());
        }
        
        public override void PostInitialize()
        {
            IocManager.Resolve<ApplicationPartManager>()
                .AddApplicationPartsIfNotAddedBefore(typeof(SeeSpecWebMvcModule).Assembly);
        }
    }
}