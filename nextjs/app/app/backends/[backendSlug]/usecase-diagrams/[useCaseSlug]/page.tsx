"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { UseCaseDiagramWorkspace } from "@/app/components/app/usecase-diagram-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { findBackendBySlug, findUseCaseBySlug, type BackendRecord, type BackendUseCaseRecord } from "@/app/lib/mock-backends";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendUseCaseDiagramPage() {
    const params = useParams<{ backendSlug: string; useCaseSlug: string }>();
    const { session } = useUserState();
    const [backend] = useState<BackendRecord | null>(() => findBackendBySlug(params.backendSlug));
    const [useCase] = useState<BackendUseCaseRecord | null>(() => {
        const nextBackend = findBackendBySlug(params.backendSlug);
        return nextBackend ? findUseCaseBySlug(nextBackend, params.useCaseSlug) : null;
    });

    if (!hasPermission(session, APP_PERMISSIONS.usecaseDiagrams)) {
        return <AccessPanel title="Use Case Diagrams" message="Your current role does not allow access to use case diagrams." />;
    }

    if (!backend || !useCase) {
        return (
            <section className="page-section">
                <div className="card backend-state-card">
                    <div className="card-body backend-blocked-state">
                        <strong>Use case not found.</strong>
                        <p>Select a valid backend use case from the backend workspace.</p>
                    </div>
                </div>
            </section>
        );
    }

    return <UseCaseDiagramWorkspace backend={backend} useCase={useCase} />;
}
