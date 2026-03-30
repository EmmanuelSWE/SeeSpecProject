 "use client";

import { AccessPanel } from "@/app/components/app/access-panel";
import { PlaceholderPage } from "@/app/components/app/placeholder-page";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function DomainModelPage() {
  const { session } = useUserState();

  if (!hasPermission(session, APP_PERMISSIONS.domainModel)) {
    return <AccessPanel title="Domain model" message="Your current role does not allow access to the domain model." />;
  }

  return (
    <PlaceholderPage
      title="Domain model"
      description="Domain model workspace placeholder. This route is reserved for the SVG-driven domain model page."
    />
  );
}
