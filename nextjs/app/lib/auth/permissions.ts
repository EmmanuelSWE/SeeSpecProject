import type { IUserSession } from "@/app/lib/providers/userProvider/context";

export const APP_PERMISSIONS = {
  dashboard: "Pages.Dashboard",
  requirements: "Pages.Requirements",
  assignments: "Pages.Assignments",
  usecaseDiagrams: "Pages.UsecaseDiagrams",
  domainModel: "Pages.DomainModel",
  activityDiagram: "Pages.ActivityDiagram",
  settings: "Pages.Settings",
  users: "Pages.Users",
  usersActivation: "Pages.Users.Activation",
  roles: "Pages.Roles",
  tenants: "Pages.Tenants",
  tenantsCreate: "Pages.Tenants.Create",
  tenantsEdit: "Pages.Tenants.Edit",
  tenantsDelete: "Pages.Tenants.Delete"
} as const;

export function hasPermission(session: IUserSession | null, permission: string) {
  return Boolean(session?.grantedPermissions?.includes(permission));
}

export function hasAnyPermission(session: IUserSession | null, permissions: string[]) {
  return permissions.some((permission) => hasPermission(session, permission));
}

export function isHostSession(session: IUserSession | null) {
  return session?.tenantId == null;
}

export function isTenantAdminSession(session: IUserSession | null) {
  return Boolean(session?.tenantId != null && session?.roleNames?.includes("Tenant Admin"));
}
