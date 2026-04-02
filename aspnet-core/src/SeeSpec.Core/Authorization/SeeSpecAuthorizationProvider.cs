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
            var users = context.CreatePermission(PermissionNames.Pages_Users, L("Users"));
            users.CreateChildPermission(PermissionNames.Pages_Users_Create, L("CreateUsers"));
            users.CreateChildPermission(PermissionNames.Pages_Users_Edit, L("EditUsers"));
            users.CreateChildPermission(PermissionNames.Pages_Users_Delete, L("DeleteUsers"));
            users.CreateChildPermission(PermissionNames.Pages_Users_Activation, L("UsersActivation"));
            users.CreateChildPermission(PermissionNames.Pages_Users_ResetPassword, L("ResetPassword"));
            users.CreateChildPermission(PermissionNames.Pages_Users_AssignRoles, L("AssignRoles"));

            context.CreatePermission(PermissionNames.Pages_Roles, L("Roles"));
            context.CreatePermission(PermissionNames.Pages_Tenants, L("Tenants"), multiTenancySides: MultiTenancySides.Host | MultiTenancySides.Tenant);
            context.CreatePermission(PermissionNames.Pages_Tenants_Create, L("CreateTenant"), multiTenancySides: MultiTenancySides.Host);
            context.CreatePermission(PermissionNames.Pages_Tenants_Edit, L("EditTenant"), multiTenancySides: MultiTenancySides.Host | MultiTenancySides.Tenant);
            context.CreatePermission(PermissionNames.Pages_Tenants_Delete, L("DeleteTenant"), multiTenancySides: MultiTenancySides.Host);

            var requirements = context.CreatePermission(PermissionNames.Pages_Requirements, L("Requirements"), multiTenancySides: MultiTenancySides.Tenant);
            requirements.CreateChildPermission(PermissionNames.Pages_Requirements_Create, L("CreateRequirements"));
            requirements.CreateChildPermission(PermissionNames.Pages_Requirements_Edit, L("EditRequirements"));
            requirements.CreateChildPermission(PermissionNames.Pages_Requirements_Delete, L("DeleteRequirements"));
            requirements.CreateChildPermission(PermissionNames.Pages_Requirements_Approve, L("ApproveRequirements"));
            requirements.CreateChildPermission(PermissionNames.Pages_Requirements_Unlock, L("UnlockRequirements"));
            requirements.CreateChildPermission(PermissionNames.Pages_Requirements_Comment, L("CommentRequirements"));
            requirements.CreateChildPermission(PermissionNames.Pages_Requirements_ViewAll, L("ViewAllRequirements"));

            var diagrams = context.CreatePermission(PermissionNames.Pages_Diagrams, L("Diagrams"), multiTenancySides: MultiTenancySides.Tenant);
            diagrams.CreateChildPermission(PermissionNames.Pages_Diagrams_Create, L("CreateDiagrams"));
            diagrams.CreateChildPermission(PermissionNames.Pages_Diagrams_Edit, L("EditDiagrams"));
            diagrams.CreateChildPermission(PermissionNames.Pages_Diagrams_Delete, L("DeleteDiagrams"));
            diagrams.CreateChildPermission(PermissionNames.Pages_Diagrams_View, L("ViewDiagrams"));
            diagrams.CreateChildPermission(PermissionNames.Pages_Diagrams_Finalize, L("FinalizeDiagrams"));

            var tasks = context.CreatePermission(PermissionNames.Pages_Tasks, L("Tasks"), multiTenancySides: MultiTenancySides.Tenant);
            tasks.CreateChildPermission(PermissionNames.Pages_Tasks_Create, L("CreateTasks"));
            tasks.CreateChildPermission(PermissionNames.Pages_Tasks_Edit, L("EditTasks"));
            tasks.CreateChildPermission(PermissionNames.Pages_Tasks_Delete, L("DeleteTasks"));
            tasks.CreateChildPermission(PermissionNames.Pages_Tasks_Assign, L("AssignTasks"));
            tasks.CreateChildPermission(PermissionNames.Pages_Tasks_Complete, L("CompleteTasks"));
            tasks.CreateChildPermission(PermissionNames.Pages_Tasks_Reassign, L("ReassignTasks"));
            tasks.CreateChildPermission(PermissionNames.Pages_Tasks_ViewAll, L("ViewAllTasks"));
            tasks.CreateChildPermission(PermissionNames.Pages_Tasks_ManageStatus, L("ManageTaskStatus"));

            var assignments = context.CreatePermission(PermissionNames.Pages_Assignments, L("Assignments"), multiTenancySides: MultiTenancySides.Tenant);
            assignments.CreateChildPermission(PermissionNames.Pages_Assignments_Create, L("CreateAssignments"));
            assignments.CreateChildPermission(PermissionNames.Pages_Assignments_Edit, L("EditAssignments"));
            assignments.CreateChildPermission(PermissionNames.Pages_Assignments_Delete, L("DeleteAssignments"));
            assignments.CreateChildPermission(PermissionNames.Pages_Assignments_AssignPeople, L("AssignPeople"));
            assignments.CreateChildPermission(PermissionNames.Pages_Assignments_Complete, L("CompleteAssignments"));
            assignments.CreateChildPermission(PermissionNames.Pages_Assignments_Reassign, L("ReassignAssignments"));
            assignments.CreateChildPermission(PermissionNames.Pages_Assignments_ViewAll, L("ViewAllAssignments"));
            assignments.CreateChildPermission(PermissionNames.Pages_Assignments_ManageStatus, L("ManageAssignmentStatus"));

            var team = context.CreatePermission(PermissionNames.Pages_Team, L("Team"), multiTenancySides: MultiTenancySides.Tenant);
            team.CreateChildPermission(PermissionNames.Pages_Team_View, L("ViewTeam"));
            team.CreateChildPermission(PermissionNames.Pages_Team_AddPeople, L("AddPeople"));
            team.CreateChildPermission(PermissionNames.Pages_Team_EditPeople, L("EditPeople"));
            team.CreateChildPermission(PermissionNames.Pages_Team_RemovePeople, L("RemovePeople"));
            team.CreateChildPermission(PermissionNames.Pages_Team_ViewAll, L("ViewAllTeam"));

            var notifications = context.CreatePermission(PermissionNames.Pages_Notifications, L("Notifications"), multiTenancySides: MultiTenancySides.Tenant);
            notifications.CreateChildPermission(PermissionNames.Pages_Notifications_View, L("ViewNotifications"));
            notifications.CreateChildPermission(PermissionNames.Pages_Notifications_Manage, L("ManageNotifications"));

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
