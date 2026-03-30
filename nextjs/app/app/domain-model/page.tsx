"use client";

import { useEffect, useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { DomainModelList } from "@/app/components/app/domain-model-list";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { readBackendRecords, type BackendRecord } from "@/app/lib/mock-backends";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function DomainModelPage() {
  const { session } = useUserState();
  const [backends, setBackends] = useState<BackendRecord[]>([]);

  useEffect(() => {
    setBackends(readBackendRecords());
  }, []);

  if (!hasPermission(session, APP_PERMISSIONS.domainModel)) {
    return <AccessPanel title="Domain model" message="Your current role does not allow access to the domain model." />;
  }

  return <DomainModelList backends={backends} />;
}
