"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { BackendOverviewWorkspace } from "@/app/components/app/backend-overview-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { findBackendBySlug, type BackendRecord } from "@/app/lib/mock-backends";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendOverviewPage() {
    const params = useParams<{ backendSlug: string }>();
    const { session } = useUserState();
    const [backend, setBackend] = useState<BackendRecord | null | undefined>(undefined);

    useEffect(() => {
        setBackend(findBackendBySlug(params.backendSlug));
    }, [params]);

    if (!hasPermission(session, APP_PERMISSIONS.backends)) {
        return <AccessPanel title="Backends" message="Your current role does not allow access to backend workspaces." />;
    }

    if (backend === undefined) {
        return (
            <section className="page-section">
                <div className="card backend-state-card">
                    <div className="card-body backend-blocked-state">
                        <strong>Loading backend workspace...</strong>
                    </div>
                </div>
            </section>
        );
    }

    if (backend === null) {
        return (
            <section className="page-section">
                <div className="card backend-state-card">
                    <div className="card-body backend-blocked-state">
                        <strong>Backend not found.</strong>
                        <p>Select an available backend from the backends workspace.</p>
                    </div>
                </div>
            </section>
        );
    }

    return <BackendOverviewWorkspace backend={backend} onBackendChange={setBackend} />;
}
