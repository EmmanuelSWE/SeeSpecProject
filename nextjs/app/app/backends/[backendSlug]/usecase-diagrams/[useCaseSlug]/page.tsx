"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
    const [hasResolvedBackend, setHasResolvedBackend] = useState(false);
    const [hasResolvedData, setHasResolvedData] = useState(false);
    const [pageErrorMessage, setPageErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;

        getBackendBySlug(params.backendSlug)
            .catch((error) => {
                if (!isActive) {
                    return;
                }

                setPageErrorMessage(error instanceof Error ? error.message : "Unable to load this backend.");
            })
            .finally(() => {
                if (isActive) {
                    setHasResolvedBackend(true);
                }
            });

        return () => {
            isActive = false;
        };
    }, [getBackendBySlug, params.backendSlug]);

    useEffect(() => {
        let isActive = true;
        if (backendId !== null) {
            Promise.all([
                getDiagramElementsByBackendAndType(backendId, "use-case"),
                getSectionsByBackendAndType(backendId, "requirement")
            ])
                .catch((error) => {
                    if (!isActive) {
                        return;
                    }

                    setPageErrorMessage(
                        error instanceof Error ? error.message : "Unable to load the use case diagram."
                    );
                })
                .finally(() => {
                    if (isActive) {
                        setHasResolvedData(true);
                    }
                });
            return () => {
                isActive = false;
            };
        }
        return () => {
            isActive = false;
        };
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

    if (pageErrorMessage) {
        return (
            <section className="page-section">
                <div className="card backend-state-card">
                    <div className="card-body backend-blocked-state">
                        <strong>Use case diagram failed to load.</strong>
                        <p>{pageErrorMessage}</p>
                    </div>
                </div>
            </section>
        );
    }

    if (!hasResolvedBackend || (backend !== null && !hasResolvedData)) {
        return (
            <section className="page-section">
                <div className="card backend-state-card">
                    <div className="card-body backend-blocked-state">
                        <strong>Loading use case diagram...</strong>
                        <p>Fetching the linked requirement context and persisted semantic diagram.</p>
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
