"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { UseCaseDiagramWorkspace } from "@/app/components/app/usecase-diagram-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { findBackendBySlug, findUseCaseBySlug, type BackendRecord, type BackendUseCaseRecord } from "@/app/lib/mock-backends";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendUseCaseDiagramPage() {
    const params = useParams<{ backendSlug: string; useCaseSlug: string }>();
    const { session } = useUserState();
    const [backend, setBackend] = useState<BackendRecord | null | undefined>(undefined);
    const [useCase, setUseCase] = useState<BackendUseCaseRecord | null | undefined>(undefined);

    useEffect(() => {
        const nextBackend = findBackendBySlug(params.backendSlug);
        setBackend(nextBackend);
        setUseCase(nextBackend ? findUseCaseBySlug(nextBackend, params.useCaseSlug) : null);
    }, [params]);

    if (!hasPermission(session, APP_PERMISSIONS.usecaseDiagrams)) {
        return <AccessPanel title="Use Case Diagrams" message="Your current role does not allow access to use case diagrams." />;
    }

    if (backend === undefined || useCase === undefined) {
        return null;
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
