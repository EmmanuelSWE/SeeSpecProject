using Abp.Authorization;
using Abp.Localization;
using Abp.MultiTenancy;

namespace SeeSpec.Authorization
{
    public class SeeSpecAuthorizationProvider : AuthorizationProvider
    {
        public override void SetPermissions(IPermissionDefinitionContext context)
        {
            context.CreatePermission(PermissionNames.Pages_Dashboard, L("Dashboard"));
            context.CreatePermission(PermissionNames.Pages_Users, L("Users"));
            context.CreatePermission(PermissionNames.Pages_Users_Activation, L("UsersActivation"));
            context.CreatePermission(PermissionNames.Pages_Roles, L("Roles"));
            context.CreatePermission(PermissionNames.Pages_Tenants, L("Tenants"), multiTenancySides: MultiTenancySides.Host | MultiTenancySides.Tenant);
            context.CreatePermission(PermissionNames.Pages_Tenants_Create, L("CreateTenant"), multiTenancySides: MultiTenancySides.Host);
            context.CreatePermission(PermissionNames.Pages_Tenants_Edit, L("EditTenant"), multiTenancySides: MultiTenancySides.Host | MultiTenancySides.Tenant);
            context.CreatePermission(PermissionNames.Pages_Tenants_Delete, L("DeleteTenant"), multiTenancySides: MultiTenancySides.Host);
            context.CreatePermission(PermissionNames.Pages_Requirements, L("Requirements"), multiTenancySides: MultiTenancySides.Tenant);
            context.CreatePermission(PermissionNames.Pages_Assignments, L("Assignments"), multiTenancySides: MultiTenancySides.Tenant);
            context.CreatePermission(PermissionNames.Pages_UsecaseDiagrams, L("UsecaseDiagrams"), multiTenancySides: MultiTenancySides.Tenant);
            context.CreatePermission(PermissionNames.Pages_DomainModel, L("DomainModel"), multiTenancySides: MultiTenancySides.Tenant);
            context.CreatePermission(PermissionNames.Pages_ActivityDiagram, L("ActivityDiagram"), multiTenancySides: MultiTenancySides.Tenant);
            context.CreatePermission(PermissionNames.Pages_Settings, L("Settings"), multiTenancySides: MultiTenancySides.Tenant);
        }

        private static ILocalizableString L(string name)
        {
            return new LocalizableString(name, SeeSpecConsts.LocalizationSourceName);
        }
    }
}
