"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useDiagramElementActions, useDiagramElementState } from "@/app/lib/providers/diagramElementProvider";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendUseCaseIndexPage() {
    const params = useParams<{ backendSlug: string }>();
    const router = useRouter();
    const { session } = useUserState();
    const { backend } = useBackendState();
    const { diagramElements } = useDiagramElementState();
    const { getBackendBySlug } = useBackendActions();
    const { getDiagramElementsByBackendAndType } = useDiagramElementActions();

    useEffect(() => {
        getBackendBySlug(params.backendSlug).catch(() => {});
    }, [getBackendBySlug, params.backendSlug]);

    useEffect(() => {
        if (backend) {
            getDiagramElementsByBackendAndType(backend.id, "use-case").catch(() => {});
        }
    }, [backend?.id, getDiagramElementsByBackendAndType]);

    useEffect(() => {
        if (backend && diagramElements.length > 0) {
            router.replace(`/app/backends/${backend.slug}/usecase-diagrams/${diagramElements[0].slug}`);
        }
    }, [backend, diagramElements, router]);

    if (!hasPermission(session, APP_PERMISSIONS.usecaseDiagrams)) {
        return <AccessPanel title="Use Case Diagrams" message="Your current role does not allow access to use case diagrams." />;
    }

    if (!backend || diagramElements.length === 0) {
        return (
            <section className="page-section">
                <div className="card backend-state-card">
                    <div className="card-body backend-blocked-state">
                        <strong>No use cases are defined for this backend yet.</strong>
                        <p>Create or seed backend use cases before opening the diagram workspace.</p>
                    </div>
                </div>
            </section>
        );
    }

    return null;
}
