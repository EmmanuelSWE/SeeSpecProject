"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { UseCaseDiagramWorkspace } from "@/app/components/app/usecase-diagram-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useDiagramElementActions, useDiagramElementState } from "@/app/lib/providers/diagramElementProvider";
import { useSpecActions, useSpecState } from "@/app/lib/providers/specProvider";
import { useSpecSectionActions, useSpecSectionState } from "@/app/lib/providers/specSectionProvider";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendUseCaseDiagramPage() {
    const params = useParams<{ backendSlug: string; useCaseSlug: string }>();
    const { session } = useUserState();
    const { backend, isPending: isBackendPending } = useBackendState();
    const { spec, isPending: isSpecPending } = useSpecState();
    const { diagramElements, isPending: isDiagramPending } = useDiagramElementState();
    const { sections, isPending: isSectionPending } = useSpecSectionState();
    const { getBackendBySlug } = useBackendActions();
    const { getSpecByBackend } = useSpecActions();
    const { getDiagramElementsByBackendAndType } = useDiagramElementActions();
    const { getSectionsByBackendAndType } = useSpecSectionActions();

    useEffect(() => {
        getBackendBySlug(params.backendSlug).catch(() => {});
    }, [getBackendBySlug, params.backendSlug]);

    useEffect(() => {
        if (backend) {
            getSpecByBackend(backend.id).catch(() => {});
            getDiagramElementsByBackendAndType(backend.id, "use-case").catch(() => {});
            getSectionsByBackendAndType(backend.id, "requirement").catch(() => {});
        }
    }, [backend?.id, getDiagramElementsByBackendAndType, getSectionsByBackendAndType, getSpecByBackend]);

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
        () => sections.filter((section) => section.specId === spec?.id && useCase?.linkedRequirementIds.includes(section.id)),
        [sections, spec?.id, useCase?.linkedRequirementIds]
    );

    if (!hasPermission(session, APP_PERMISSIONS.usecaseDiagrams)) {
        return <AccessPanel title="Use Case Diagrams" message="Your current role does not allow access to use case diagrams." />;
    }

    if (isBackendPending || isSpecPending || isDiagramPending || isSectionPending) {
        return (
            <section className="page-section">
                <div className="card backend-state-card">
                    <div className="card-body backend-blocked-state">
                        <strong>Loading use case diagram...</strong>
                        <p>Resolving the backend, spec, and linked use case context.</p>
                    </div>
                </div>
            </section>
        );
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
