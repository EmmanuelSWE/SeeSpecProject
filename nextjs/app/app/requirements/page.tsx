"use client";

import { AccessPanel } from "@/app/components/app/access-panel";
import { RequirementsWorkspace } from "@/app/components/app/requirements-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function RequirementsPage() {
  const { session } = useUserState();

  if (!hasPermission(session, APP_PERMISSIONS.requirements)) {
    return <AccessPanel title="Requirements" message="Your current role does not allow access to requirements." />;
  }

  return <RequirementsWorkspace session={session} />;
}
