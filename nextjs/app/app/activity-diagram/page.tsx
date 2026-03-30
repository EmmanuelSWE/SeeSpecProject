 "use client";

import { AccessPanel } from "@/app/components/app/access-panel";
import { PlaceholderPage } from "@/app/components/app/placeholder-page";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function ActivityDiagramPage() {
  const { session } = useUserState();

  if (!hasPermission(session, APP_PERMISSIONS.activityDiagram)) {
    return <AccessPanel title="Activity Diagram" message="Your current role does not allow access to activity diagrams." />;
  }

  return (
    <PlaceholderPage
      title="Activity Diagram"
      description="Activity diagram workspace placeholder. This route is reserved for the SVG-driven activity page."
    />
  );
}
