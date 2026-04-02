"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { DomainModelWorkspace } from "@/app/components/app/domain-model-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { withAuth, type WithAuthProps } from "@/app/lib/auth/with-auth";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useDiagramElementActions, useDiagramElementState } from "@/app/lib/providers/diagramElementProvider";
import { useSpecSectionActions, useSpecSectionState } from "@/app/lib/providers/specSectionProvider";
import { selectOverviewSection } from "@/app/lib/workflow/overview-gate";

const WORKFLOW_ROLES = ["Host Admin", "Tenant Admin", "Business Analyst", "System Architect", "Project Lead"] as const;

function BackendDomainModelPage({ session }: WithAuthProps) {
    const params = useParams<{ backendSlug: string }>();
    const router = useRouter();
    const { backend } = useBackendState();
    const { sections } = useSpecSectionState();
    const { diagramElements } = useDiagramElementState();
    const { getBackendBySlug } = useBackendActions();
    const { getDiagramElementsByBackendAndType } = useDiagramElementActions();
    const { getSectionsByBackend } = useSpecSectionActions();
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
                getSectionsByBackend(backendId),
                getDiagramElementsByBackendAndType(backendId, "domain-model")
            ])
                .catch((error) => {
                    if (!isActive) {
                        return;
                    }

                    setPageErrorMessage(
                        error instanceof Error ? error.message : "Unable to load domain model data."
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
    }, [backendId, getDiagramElementsByBackendAndType, getSectionsByBackend]);

    const overviewSection = backend ? selectOverviewSection(sections, backend.slug) : null;

    useEffect(() => {
        if (!backend || !hasResolvedBackend || !hasResolvedData) {
            return;
        }

        if (!overviewSection || !overviewSection.isAccepted) {
            router.replace(`/app/backends/${backend.slug}/overview`);
        }
    }, [backend, hasResolvedBackend, hasResolvedData, overviewSection, router]);

    if (!hasPermission(session, APP_PERMISSIONS.domainModel)) {
        return <AccessPanel title="Domain model" message="Your current role does not allow access to the domain model." />;
    }

    if (pageErrorMessage) {
        return (
            <section className="page-section">
                <div className="card backend-state-card">
                    <div className="card-body backend-blocked-state">
                        <strong>Domain model workspace failed to load.</strong>
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
                        <strong>Loading domain model workspace...</strong>
                        <p>Fetching the overview gate and domain model diagram for this backend.</p>
                    </div>
                </div>
            </section>
        );
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

    if (!overviewSection || !overviewSection.isAccepted) {
        return null;
    }

    return <DomainModelWorkspace backend={backend} diagram={diagramElements[0] ?? null} />;
}

export default withAuth(BackendDomainModelPage, { roles: [...WORKFLOW_ROLES] });
