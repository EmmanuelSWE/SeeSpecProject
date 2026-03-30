 "use client";

import { AccessPanel } from "@/app/components/app/access-panel";
import { PlaceholderPage } from "@/app/components/app/placeholder-page";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function AssignmentsPage() {
  const { session } = useUserState();

  if (!hasPermission(session, APP_PERMISSIONS.assignments)) {
    return <AccessPanel title="Assignments" message="Your current role does not allow access to assignments." />;
  }

  return (
    <PlaceholderPage
      title="Assignments"
      description="Assignments workspace placeholder. This route is reserved for the SVG-driven assignments page."
    />
  );
}
