 "use client";

import { AccessPanel } from "@/app/components/app/access-panel";
import { PlaceholderPage } from "@/app/components/app/placeholder-page";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function UsecaseDiagramsPage() {
  const { session } = useUserState();

  if (!hasPermission(session, APP_PERMISSIONS.usecaseDiagrams)) {
    return <AccessPanel title="Usecase Diagrams" message="Your current role does not allow access to usecase diagrams." />;
  }

  return (
    <PlaceholderPage
      title="Usecase Diagrams"
      description="Usecase diagrams workspace placeholder. This route is reserved for the SVG-driven diagram page."
    />
  );
}
