 "use client";

import { AccessPanel } from "@/app/components/app/access-panel";
import { PlaceholderPage } from "@/app/components/app/placeholder-page";
import { APP_PERMISSIONS, hasAnyPermission } from "@/app/lib/auth/permissions";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function AssignmentsPage() {
  const { session } = useUserState();
  const canAccessAssignments = hasAnyPermission(session, [
    APP_PERMISSIONS.assignments,
    APP_PERMISSIONS.assignmentsCreate,
    APP_PERMISSIONS.assignmentsEdit,
    APP_PERMISSIONS.assignmentsDelete,
    APP_PERMISSIONS.assignmentsAssignPeople,
    APP_PERMISSIONS.assignmentsComplete,
    APP_PERMISSIONS.assignmentsReassign,
    APP_PERMISSIONS.assignmentsViewAll,
    APP_PERMISSIONS.assignmentsManageStatus
  ]);

  if (!canAccessAssignments) {
    return <AccessPanel title="Assignments" message="Your current role does not allow access to assignments." />;
  }

  return (
    <PlaceholderPage
      title="Assignments"
      description="Assignments workspace placeholder. This route is reserved for the SVG-driven assignments page."
    />
  );
}
