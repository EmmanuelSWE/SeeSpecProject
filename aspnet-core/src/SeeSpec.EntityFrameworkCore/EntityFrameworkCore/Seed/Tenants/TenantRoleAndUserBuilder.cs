using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Abp.Authorization;
using Abp.Authorization.Roles;
using Abp.Authorization.Users;
using Abp.MultiTenancy;
using SeeSpec.Authorization;
using SeeSpec.Authorization.Roles;
using SeeSpec.Authorization.Users;

namespace SeeSpec.EntityFrameworkCore.Seed.Tenants
{
    public class TenantRoleAndUserBuilder
    {
        private readonly SeeSpecDbContext _context;
        private readonly int _tenantId;

        public TenantRoleAndUserBuilder(SeeSpecDbContext context, int tenantId)
        {
            _context = context;
            _tenantId = tenantId;
        }

        public void Create()
        {
            CreateRolesAndUsers();
        }

        private void CreateRolesAndUsers()
        {
            var adminRole = EnsureStaticRole(StaticRoleNames.Tenants.Admin);
            var projectLeadRole = EnsureStaticRole(StaticRoleNames.Tenants.ProjectLead);
            var businessAnalystRole = EnsureStaticRole(StaticRoleNames.Tenants.BusinessAnalyst);
            var systemArchitectRole = EnsureStaticRole(StaticRoleNames.Tenants.SystemArchitect);
            var teamMemberRole = EnsureStaticRole(StaticRoleNames.Tenants.TeamMember);

            GrantMissingPermissions(
                adminRole,
                new List<string>
                {
                    PermissionNames.Pages_Dashboard,
                    PermissionNames.Pages_Settings,
                    PermissionNames.Pages_Roles,
                    PermissionNames.Pages_Requirements,
                    PermissionNames.Pages_Requirements_Approve,
                    PermissionNames.Pages_Requirements_Unlock,
                    PermissionNames.Pages_Requirements_ViewAll,
                    PermissionNames.Pages_Requirements_Comment,
                    PermissionNames.Pages_Diagrams,
                    PermissionNames.Pages_Diagrams_View,
                    PermissionNames.Pages_Tasks,
                    PermissionNames.Pages_Tasks_ViewAll,
                    PermissionNames.Pages_Tasks_Reassign,
                    PermissionNames.Pages_Tasks_ManageStatus,
                    PermissionNames.Pages_Tasks_Complete,
                    PermissionNames.Pages_Assignments,
                    PermissionNames.Pages_Assignments_ViewAll,
                    PermissionNames.Pages_Assignments_Reassign,
                    PermissionNames.Pages_Assignments_ManageStatus,
                    PermissionNames.Pages_Assignments_Complete,
                    PermissionNames.Pages_Team,
                    PermissionNames.Pages_Team_View,
                    PermissionNames.Pages_Team_AddPeople,
                    PermissionNames.Pages_Team_EditPeople,
                    PermissionNames.Pages_Team_RemovePeople,
                    PermissionNames.Pages_Team_ViewAll,
                    PermissionNames.Pages_Users,
                    PermissionNames.Pages_Users_Create,
                    PermissionNames.Pages_Users_Edit,
                    PermissionNames.Pages_Users_Delete,
                    PermissionNames.Pages_Users_Activation,
                    PermissionNames.Pages_Users_ResetPassword,
                    PermissionNames.Pages_Users_AssignRoles,
                    PermissionNames.Pages_Notifications,
                    PermissionNames.Pages_Notifications_View,
                    PermissionNames.Pages_Notifications_Manage
                }
            );

            GrantMissingPermissions(
                projectLeadRole,
                new List<string>
                {
                    PermissionNames.Pages_Dashboard,
                    PermissionNames.Pages_Requirements,
                    PermissionNames.Pages_Requirements_Approve,
                    PermissionNames.Pages_Requirements_Unlock,
                    PermissionNames.Pages_Requirements_ViewAll,
                    PermissionNames.Pages_Requirements_Comment,
                    PermissionNames.Pages_Diagrams,
                    PermissionNames.Pages_Diagrams_View,
                    PermissionNames.Pages_Tasks,
                    PermissionNames.Pages_Tasks_ViewAll,
                    PermissionNames.Pages_Tasks_Reassign,
                    PermissionNames.Pages_Tasks_ManageStatus,
                    PermissionNames.Pages_Tasks_Complete,
                    PermissionNames.Pages_Requirements,
                    PermissionNames.Pages_Assignments,
                    PermissionNames.Pages_Assignments_ViewAll,
                    PermissionNames.Pages_Assignments_Reassign,
                    PermissionNames.Pages_Assignments_ManageStatus,
                    PermissionNames.Pages_Assignments_Complete,
                    PermissionNames.Pages_Team,
                    PermissionNames.Pages_Team_View,
                    PermissionNames.Pages_Team_AddPeople,
                    PermissionNames.Pages_Team_EditPeople,
                    PermissionNames.Pages_Team_ViewAll,
                    PermissionNames.Pages_Notifications,
                    PermissionNames.Pages_Notifications_View,
                    PermissionNames.Pages_Notifications_Manage
                }
            );

            GrantMissingPermissions(
                businessAnalystRole,
                new List<string>
                {
                    PermissionNames.Pages_Dashboard,
                    PermissionNames.Pages_Requirements,
                    PermissionNames.Pages_Requirements_Create,
                    PermissionNames.Pages_Requirements_Edit,
                    PermissionNames.Pages_Requirements_Comment,
                    PermissionNames.Pages_Assignments,
                    PermissionNames.Pages_Assignments_Create,
                    PermissionNames.Pages_Assignments_Edit,
                    PermissionNames.Pages_Assignments_AssignPeople,
                    PermissionNames.Pages_Assignments_Complete,
                    PermissionNames.Pages_Diagrams,
                    PermissionNames.Pages_Diagrams_View,
                    PermissionNames.Pages_Tasks,
                    PermissionNames.Pages_Tasks_Create,
                    PermissionNames.Pages_Tasks_Edit,
                    PermissionNames.Pages_Tasks_Assign,
                    PermissionNames.Pages_Tasks_Complete,
                    PermissionNames.Pages_Team,
                    PermissionNames.Pages_Team_View,
                    PermissionNames.Pages_Notifications,
                    PermissionNames.Pages_Notifications_View
                }
            );

            GrantMissingPermissions(
                systemArchitectRole,
                new List<string>
                {
                    PermissionNames.Pages_Dashboard,
                    PermissionNames.Pages_Requirements,
                    PermissionNames.Pages_Requirements_Comment,
                    PermissionNames.Pages_Assignments,
                    PermissionNames.Pages_Assignments_Create,
                    PermissionNames.Pages_Assignments_Edit,
                    PermissionNames.Pages_Assignments_AssignPeople,
                    PermissionNames.Pages_Assignments_Complete,
                    PermissionNames.Pages_Diagrams,
                    PermissionNames.Pages_Diagrams_View,
                    PermissionNames.Pages_Diagrams_Create,
                    PermissionNames.Pages_Diagrams_Edit,
                    PermissionNames.Pages_Diagrams_Delete,
                    PermissionNames.Pages_Diagrams_Finalize,
                    PermissionNames.Pages_Tasks,
                    PermissionNames.Pages_Tasks_Create,
                    PermissionNames.Pages_Tasks_Edit,
                    PermissionNames.Pages_Tasks_Assign,
                    PermissionNames.Pages_Tasks_Complete,
                    PermissionNames.Pages_Team,
                    PermissionNames.Pages_Team_View,
                    PermissionNames.Pages_Notifications,
                    PermissionNames.Pages_Notifications_View
                }
            );

            GrantMissingPermissions(
                teamMemberRole,
                new List<string>
                {
                    PermissionNames.Pages_Dashboard,
                    PermissionNames.Pages_Requirements,
                    PermissionNames.Pages_Requirements_Create,
                    PermissionNames.Pages_Requirements_Edit,
                    PermissionNames.Pages_Requirements_Comment,
                    PermissionNames.Pages_Assignments,
                    PermissionNames.Pages_Assignments_Create,
                    PermissionNames.Pages_Assignments_Edit,
                    PermissionNames.Pages_Assignments_AssignPeople,
                    PermissionNames.Pages_Assignments_Complete,
                    PermissionNames.Pages_Diagrams,
                    PermissionNames.Pages_Diagrams_View,
                    PermissionNames.Pages_Tasks,
                    PermissionNames.Pages_Tasks_Create,
                    PermissionNames.Pages_Tasks_Edit,
                    PermissionNames.Pages_Tasks_Assign,
                    PermissionNames.Pages_Tasks_Complete,
                    PermissionNames.Pages_Team,
                    PermissionNames.Pages_Team_View,
                    PermissionNames.Pages_Notifications,
                    PermissionNames.Pages_Notifications_View
                }
            );

            var adminUser = _context.Users.IgnoreQueryFilters().FirstOrDefault(u => u.TenantId == _tenantId && u.UserName == AbpUserBase.AdminUserName);
            if (adminUser == null)
            {
                adminUser = User.CreateTenantAdminUser(_tenantId, "admin@defaulttenant.com");
                adminUser.Password = new PasswordHasher<User>(new OptionsWrapper<PasswordHasherOptions>(new PasswordHasherOptions()))
                    .HashPassword(adminUser, User.DefaultPassword);
                adminUser.IsEmailConfirmed = true;
                adminUser.IsActive = true;

                _context.Users.Add(adminUser);
                _context.SaveChanges();

                _context.UserRoles.Add(new UserRole(_tenantId, adminUser.Id, adminRole.Id));
                _context.SaveChanges();
            }
        }

        private Role EnsureStaticRole(string roleName)
        {
            var legacyRoleNames = GetLegacyRoleNames(roleName);
            var role = _context.Roles.IgnoreQueryFilters().FirstOrDefault(r =>
                r.TenantId == _tenantId && (r.Name == roleName || legacyRoleNames.Contains(r.Name)));
            if (role == null)
            {
                role = _context.Roles.Add(new Role(_tenantId, roleName, roleName) { IsStatic = true }).Entity;
            }
            else
            {
                role.Name = roleName;
                role.DisplayName = roleName;
                role.NormalizedName = roleName.ToUpperInvariant();
                role.IsStatic = true;
            }

            _context.SaveChanges();

            return role;
        }

        private static List<string> GetLegacyRoleNames(string roleName)
        {
            if (roleName == StaticRoleNames.Tenants.Admin)
            {
                return new List<string> { "Admin" };
            }

            if (roleName == StaticRoleNames.Tenants.ProjectLead)
            {
                return new List<string> { "ProjectLead" };
            }

            if (roleName == StaticRoleNames.Tenants.BusinessAnalyst)
            {
                return new List<string> { "BusinessAnalyst" };
            }

            if (roleName == StaticRoleNames.Tenants.SystemArchitect)
            {
                return new List<string> { "System Analyst", "SystemsArchitect" };
            }

            if (roleName == StaticRoleNames.Tenants.TeamMember)
            {
                return new List<string> { "TeamMember", "Developer", "Tester" };
            }

            return new List<string>();
        }

        private void GrantMissingPermissions(Role role, List<string> permissionNames)
        {
            var grantedPermissions = _context.Permissions.IgnoreQueryFilters()
                .OfType<RolePermissionSetting>()
                .Where(permission => permission.TenantId == _tenantId && permission.RoleId == role.Id)
                .Select(permission => permission.Name)
                .ToList();

            var missingPermissions = permissionNames
                .Where(permissionName => !grantedPermissions.Contains(permissionName))
                .ToList();

            if (!missingPermissions.Any())
            {
                return;
            }

            _context.Permissions.AddRange(
                missingPermissions.Select(permissionName => new RolePermissionSetting
                {
                    TenantId = _tenantId,
                    Name = permissionName,
                    IsGranted = true,
                    RoleId = role.Id
                })
            );
            _context.SaveChanges();
        }
    }
}
