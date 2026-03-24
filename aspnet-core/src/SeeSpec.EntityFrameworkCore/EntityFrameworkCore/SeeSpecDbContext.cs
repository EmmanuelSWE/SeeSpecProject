using Microsoft.EntityFrameworkCore;
using Abp.Zero.EntityFrameworkCore;
using SeeSpec.Authorization.Roles;
using SeeSpec.Authorization.Users;
using SeeSpec.MultiTenancy;

namespace SeeSpec.EntityFrameworkCore
{
    public class SeeSpecDbContext : AbpZeroDbContext<Tenant, Role, User, SeeSpecDbContext>
    {
        /* Define a DbSet for each entity of the application */
        
        public SeeSpecDbContext(DbContextOptions<SeeSpecDbContext> options)
            : base(options)
        {
        }
    }
}
