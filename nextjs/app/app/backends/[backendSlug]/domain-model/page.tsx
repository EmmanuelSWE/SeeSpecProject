"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { DomainModelWorkspace } from "@/app/components/app/domain-model-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { findBackendBySlug, type BackendRecord } from "@/app/lib/mock-backends";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendDomainModelPage() {
    const params = useParams<{ backendSlug: string }>();
    const { session } = useUserState();
    const [backend, setBackend] = useState<BackendRecord | null | undefined>(undefined);

    useEffect(() => {
        setBackend(findBackendBySlug(params.backendSlug));
    }, [params]);

    if (!hasPermission(session, APP_PERMISSIONS.domainModel)) {
        return <AccessPanel title="Domain model" message="Your current role does not allow access to the domain model." />;
    }

    if (backend === undefined) {
        return null;
    }

    if (!backend) {
        return (
            <section className="page-section">
                <div className="card backend-state-card">
                    <div className="card-body backend-blocked-state">
                        <strong>Backend not found.</strong>
                        <p>Select a valid backend from the domain model list.</p>
                    </div>
                </div>
            </section>
        );
    }

    return <DomainModelWorkspace backend={backend} />;
}
