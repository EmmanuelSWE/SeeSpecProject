"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { UseCaseDiagramWorkspace } from "@/app/components/app/usecase-diagram-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useDiagramElementActions, useDiagramElementState } from "@/app/lib/providers/diagramElementProvider";
import { useSpecSectionActions, useSpecSectionState } from "@/app/lib/providers/specSectionProvider";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendUseCaseDiagramPage() {
    const params = useParams<{ backendSlug: string; useCaseSlug: string }>();
    const { session } = useUserState();
    const { backend } = useBackendState();
    const { diagramElements } = useDiagramElementState();
    const { sections } = useSpecSectionState();
    const { getBackendBySlug } = useBackendActions();
    const { getDiagramElementsByBackendAndType } = useDiagramElementActions();
    const { getSectionsByBackendAndType } = useSpecSectionActions();
    const backendId = backend?.id ?? null;

    useEffect(() => {
        getBackendBySlug(params.backendSlug).catch(() => {});
    }, [getBackendBySlug, params.backendSlug]);

    useEffect(() => {
        if (backendId !== null) {
            getDiagramElementsByBackendAndType(backendId, "use-case").catch(() => {});
            getSectionsByBackendAndType(backendId, "requirement").catch(() => {});
        }
    }, [backendId, getDiagramElementsByBackendAndType, getSectionsByBackendAndType]);

    const useCase = useMemo(
        () =>
            diagramElements.find(
                (item) =>
                    item.backendId === backend?.id &&
                    item.type === "use-case" &&
                    item.slug === params.useCaseSlug
            ) ?? null,
        [backend?.id, diagramElements, params.useCaseSlug]
    );
    const linkedRequirements = useMemo(
        () => sections.filter((section) => useCase?.linkedRequirementIds.includes(section.id)),
        [sections, useCase?.linkedRequirementIds]
    );

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

    return <UseCaseDiagramWorkspace backend={backend} useCase={useCase} linkedRequirements={linkedRequirements} />;
}
