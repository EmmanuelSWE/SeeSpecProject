 "use client";

import { AccessPanel } from "@/app/components/app/access-panel";
import { PlaceholderPage } from "@/app/components/app/placeholder-page";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function SettingsPage() {
  const { session } = useUserState();

  if (!hasPermission(session, APP_PERMISSIONS.settings)) {
    return <AccessPanel title="Settings" message="Your current role does not allow access to settings." />;
  }

  return (
    <PlaceholderPage
      title="Settings"
      description="Settings workspace placeholder. This route is reserved for the SVG-driven settings page."
    />
  );
}
