"use client";

export const dynamic = "force-dynamic";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { StateIllustration } from "@/app/components/app/state-illustration";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useDiagramElementActions, useDiagramElementState } from "@/app/lib/providers/diagramElementProvider";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendUseCaseIndexPage() {
    const params = useParams<{ backendSlug: string }>();
    const backendSlug = params?.backendSlug ?? null;
    const router = useRouter();
    const { session } = useUserState();
    const { backend } = useBackendState();
    const { diagramElements } = useDiagramElementState();
    const { getBackendBySlug } = useBackendActions();
    const { getDiagramElementsByBackendAndType } = useDiagramElementActions();
    const backendId = backend?.id ?? null;

    useEffect(() => {
        if (!backendSlug) {
            return;
        }

        getBackendBySlug(backendSlug).catch(() => {});
    }, [backendSlug, getBackendBySlug]);

    useEffect(() => {
        if (backendId !== null) {
            getDiagramElementsByBackendAndType(backendId, "use-case").catch(() => {});
        }
    }, [backendId, getDiagramElementsByBackendAndType]);

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
                        <StateIllustration
                            kind="empty"
                            title="No use case diagrams yet"
                            message="Create the first requirement, then start the use case diagram from that requirement so the diagram stays scoped correctly."
                            actions={
                                <button
                                    type="button"
                                    className="requirements-action-button"
                                    onClick={() => {
                                        if (!backendSlug) {
                                            return;
                                        }

                                        router.push(`/app/backends/${backendSlug}/requirements`);
                                    }}
                                >
                                    Go to requirements
                                </button>
                            }
                        />
                    </div>
                </div>
            </section>
        );
    }

    return null;
}
