import type { IUserSession } from "@/app/lib/providers/userProvider/context";

export const APP_PERMISSIONS = {
  dashboard: "Pages.Dashboard",
  backends: "Pages.Dashboard",
  requirements: "Pages.Requirements",
  requirementsCreate: "Pages.Requirements.Create",
  requirementsEdit: "Pages.Requirements.Edit",
  requirementsApprove: "Pages.Requirements.Approve",
  requirementsUnlock: "Pages.Requirements.Unlock",
  requirementsComment: "Pages.Requirements.Comment",
  requirementsViewAll: "Pages.Requirements.ViewAll",
  diagrams: "Pages.Diagrams",
  diagramsView: "Pages.Diagrams.View",
  diagramsCreate: "Pages.Diagrams.Create",
  diagramsEdit: "Pages.Diagrams.Edit",
  diagramsDelete: "Pages.Diagrams.Delete",
  tasks: "Pages.Tasks",
  tasksCreate: "Pages.Tasks.Create",
  tasksEdit: "Pages.Tasks.Edit",
  tasksDelete: "Pages.Tasks.Delete",
  tasksAssign: "Pages.Tasks.Assign",
  tasksComplete: "Pages.Tasks.Complete",
  tasksReassign: "Pages.Tasks.Reassign",
  tasksViewAll: "Pages.Tasks.ViewAll",
  tasksManageStatus: "Pages.Tasks.ManageStatus",
  assignments: "Pages.Assignments",
  assignmentsCreate: "Pages.Assignments.Create",
  assignmentsEdit: "Pages.Assignments.Edit",
  assignmentsDelete: "Pages.Assignments.Delete",
  assignmentsAssignPeople: "Pages.Assignments.AssignPeople",
  assignmentsComplete: "Pages.Assignments.Complete",
  assignmentsReassign: "Pages.Assignments.Reassign",
  assignmentsViewAll: "Pages.Assignments.ViewAll",
  assignmentsManageStatus: "Pages.Assignments.ManageStatus",
  team: "Pages.Team",
  teamView: "Pages.Team.View",
  teamAddPeople: "Pages.Team.AddPeople",
  teamEditPeople: "Pages.Team.EditPeople",
  teamRemovePeople: "Pages.Team.RemovePeople",
  teamViewAll: "Pages.Team.ViewAll",
  usecaseDiagrams: "Pages.Diagrams.View",
  domainModel: "Pages.Diagrams.View",
  activityDiagram: "Pages.Diagrams.View",
  settings: "Pages.Settings",
  users: "Pages.Users",
  usersCreate: "Pages.Users.Create",
  usersEdit: "Pages.Users.Edit",
  usersDelete: "Pages.Users.Delete",
  usersActivation: "Pages.Users.Edit",
  usersResetPassword: "Pages.Users.ResetPassword",
  usersAssignRoles: "Pages.Users.AssignRoles",
  roles: "Pages.Roles",
  notifications: "Pages.Notifications",
  notificationsView: "Pages.Notifications.View",
  notificationsManage: "Pages.Notifications.Manage",
  tenants: "Pages.Tenants",
  tenantsCreate: "Pages.Tenants.Create",
  tenantsEdit: "Pages.Tenants.Edit",
  tenantsDelete: "Pages.Tenants.Delete"
} as const;

export function hasPermission(session: IUserSession | null, permission: string) {
  return true;
}

export function hasAnyPermission(session: IUserSession | null, permissions: string[]) {
  return true;
}

export function isHostSession(session: IUserSession | null) {
  return session?.tenantId == null;
}

export function isTenantAdminSession(session: IUserSession | null) {
  return Boolean(session?.tenantId != null && session?.roleNames?.includes("Tenant Admin"));
}
