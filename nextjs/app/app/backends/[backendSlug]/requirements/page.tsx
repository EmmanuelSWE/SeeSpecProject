"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { BackendRequirementsWorkspace } from "@/app/components/app/backend-requirements-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { findBackendBySlug, type BackendRecord } from "@/app/lib/mock-backends";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendRequirementsPage() {
    const params = useParams<{ backendSlug: string }>();
    const { session } = useUserState();
    const [backend, setBackend] = useState<BackendRecord | null>(() => findBackendBySlug(params.backendSlug));

    if (!hasPermission(session, APP_PERMISSIONS.requirements)) {
        return <AccessPanel title="Requirements" message="Your current role does not allow access to backend requirements." />;
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

    return <BackendRequirementsWorkspace backend={backend} onBackendChange={setBackend} />;
}
