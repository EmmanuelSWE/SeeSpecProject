using System.Linq;
using Microsoft.EntityFrameworkCore;
using Abp.Authorization;
using Abp.Authorization.Roles;
using Abp.Authorization.Users;
using Abp.MultiTenancy;
using SeeSpec.Authorization;
using SeeSpec.Authorization.Roles;
using SeeSpec.Authorization.Users;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace SeeSpec.EntityFrameworkCore.Seed.Host
{
    public class HostRoleAndUserCreator
    {
        private const string HostAdminUserName = AbpUserBase.AdminUserName;
        private const string HostAdminName = "admin";
        private const string HostAdminSurname = "admin";
        private const string HostAdminEmail = "admin@admin.com";
        private const string HostAdminPassword = "123";

        private readonly SeeSpecDbContext _context;

        public HostRoleAndUserCreator(SeeSpecDbContext context)
        {
            _context = context;
        }

        public void Create()
        {
            CreateHostRoleAndUsers();
        }

        private void CreateHostRoleAndUsers()
        {
            // Admin role for host

            var adminRoleForHost = _context.Roles.IgnoreQueryFilters()
                .FirstOrDefault(r => r.TenantId == null && (r.Name == StaticRoleNames.Host.Admin || r.Name == "Admin"));
            if (adminRoleForHost == null)
            {
                adminRoleForHost = _context.Roles.Add(new Role(null, StaticRoleNames.Host.Admin, StaticRoleNames.Host.Admin) { IsStatic = true, IsDefault = true }).Entity;
            }
            else
            {
                adminRoleForHost.Name = StaticRoleNames.Host.Admin;
                adminRoleForHost.DisplayName = StaticRoleNames.Host.Admin;
                adminRoleForHost.NormalizedName = StaticRoleNames.Host.Admin.ToUpperInvariant();
                adminRoleForHost.IsStatic = true;
                adminRoleForHost.IsDefault = true;
            }
            _context.SaveChanges();

            // Grant all permissions to admin role for host

            var grantedPermissions = _context.Permissions.IgnoreQueryFilters()
                .OfType<RolePermissionSetting>()
                .Where(p => p.TenantId == null && p.RoleId == adminRoleForHost.Id)
                .Select(p => p.Name)
                .ToList();

            var permissions = PermissionFinder
                .GetAllPermissions(new SeeSpecAuthorizationProvider())
                .Where(p => p.MultiTenancySides.HasFlag(MultiTenancySides.Host) &&
                            !grantedPermissions.Contains(p.Name))
                .ToList();

            if (permissions.Any())
            {
                _context.Permissions.AddRange(
                    permissions.Select(permission => new RolePermissionSetting
                    {
                        TenantId = null,
                        Name = permission.Name,
                        IsGranted = true,
                        RoleId = adminRoleForHost.Id
                    })
                );
                _context.SaveChanges();
            }

            // Admin user for host

            var adminUserForHost = _context.Users.IgnoreQueryFilters().FirstOrDefault(u => u.TenantId == null && u.UserName == HostAdminUserName);
            if (adminUserForHost == null)
            {
                var user = new User
                {
                    TenantId = null,
                    UserName = HostAdminUserName,
                    Name = HostAdminName,
                    Surname = HostAdminSurname,
                    EmailAddress = HostAdminEmail,
                    IsEmailConfirmed = true,
                    IsActive = true
                };

                user.Password = new PasswordHasher<User>(new OptionsWrapper<PasswordHasherOptions>(new PasswordHasherOptions())).HashPassword(user, HostAdminPassword);
                user.SetNormalizedNames();

                adminUserForHost = _context.Users.Add(user).Entity;
                _context.SaveChanges();
            }

            adminUserForHost.Name = HostAdminName;
            adminUserForHost.Surname = HostAdminSurname;
            adminUserForHost.EmailAddress = HostAdminEmail;
            adminUserForHost.IsEmailConfirmed = true;
            adminUserForHost.IsActive = true;
            adminUserForHost.Password = new PasswordHasher<User>(new OptionsWrapper<PasswordHasherOptions>(new PasswordHasherOptions()))
                .HashPassword(adminUserForHost, HostAdminPassword);
            adminUserForHost.SetNormalizedNames();
            _context.SaveChanges();

            var hasAdminRole = _context.UserRoles.IgnoreQueryFilters()
                .Any(ur => ur.TenantId == null && ur.UserId == adminUserForHost.Id && ur.RoleId == adminRoleForHost.Id);

            if (!hasAdminRole)
            {
                _context.UserRoles.Add(new UserRole(null, adminUserForHost.Id, adminRoleForHost.Id));
                _context.SaveChanges();
            }
        }
    }
}
