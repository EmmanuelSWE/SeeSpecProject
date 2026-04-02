"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { BackendRequirementsWorkspace } from "@/app/components/app/backend-requirements-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { withAuth, type WithAuthProps } from "@/app/lib/auth/with-auth";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useDiagramElementActions, useDiagramElementState } from "@/app/lib/providers/diagramElementProvider";
import { useSpecSectionActions, useSpecSectionState } from "@/app/lib/providers/specSectionProvider";
import { selectOverviewSection } from "@/app/lib/workflow/overview-gate";

const WORKFLOW_ROLES = ["Host Admin", "Tenant Admin", "Business Analyst", "System Architect", "Project Lead"] as const;

function BackendRequirementsPage({ session }: WithAuthProps) {
    const params = useParams<{ backendSlug: string }>();
    const router = useRouter();
    const { backend } = useBackendState();
    const { sections } = useSpecSectionState();
    const { diagramElements } = useDiagramElementState();
    const { getBackendBySlug } = useBackendActions();
    const { createDiagramElement, getDiagramElementsByBackend, updateDiagramElement } = useDiagramElementActions();
    const { createSection, getSectionsByBackend, updateSection } = useSpecSectionActions();
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
    }, [params.backendSlug, getBackendBySlug]);

    useEffect(() => {
        let isActive = true;
        if (backendId !== null) {
            Promise.all([getSectionsByBackend(backendId), getDiagramElementsByBackend(backendId)])
                .catch((error) => {
                    if (!isActive) {
                        return;
                    }

                    setPageErrorMessage(
                        error instanceof Error ? error.message : "Unable to load backend requirements."
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
    }, [backendId, getDiagramElementsByBackend, getSectionsByBackend]);

    const overviewSection = backend ? selectOverviewSection(sections, backend.slug) : null;
    const requirementSections = sections.filter((item) => item.type === "requirement");

    useEffect(() => {
        if (!backend || !hasResolvedBackend || !hasResolvedData) {
            return;
        }

        if (!overviewSection || !overviewSection.isAccepted) {
            router.replace(`/app/backends/${backend.slug}/overview`);
        }
    }, [backend, hasResolvedBackend, hasResolvedData, overviewSection, router]);

    if (!hasPermission(session, APP_PERMISSIONS.requirements)) {
        return <AccessPanel title="Requirements" message="Your current role does not allow access to backend requirements." />;
    }

    if (pageErrorMessage) {
        return (
            <section className="page-section">
                <div className="card backend-state-card">
                    <div className="card-body backend-blocked-state">
                        <strong>Requirements workspace failed to load.</strong>
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
                        <strong>Loading requirements workspace...</strong>
                        <p>Fetching requirement sections and linked diagrams for this backend.</p>
                    </div>
                </div>
            </section>
        );
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

    if (!overviewSection || !overviewSection.isAccepted) {
        return null;
    }

    return (
        <BackendRequirementsWorkspace
            backend={backend}
            overviewSection={overviewSection}
            requirementSections={requirementSections}
            useCaseDiagrams={diagramElements.filter((item) => item.type === "use-case")}
            activityDiagrams={diagramElements.filter((item) => item.type === "activity")}
            onCreateRequirement={async (payload) => {
                const created = await createSection(payload);
                await getSectionsByBackend(backend.id);
                return created;
            }}
            onUpdateRequirement={async (payload) => {
                await updateSection(payload);
                await getSectionsByBackend(backend.id);
            }}
            onCreateUseCaseDiagram={async (requirement) => {
                const created = await createDiagramElement({
                    backendId: backend.id,
                    specSectionId: requirement.id,
                    type: "use-case",
                    slug: `${backend.slug}-${requirement.code?.toLowerCase() ?? requirement.id}-use-case`,
                    name: `${requirement.title} Use Case`,
                    summary: requirement.summary,
                    description: requirement.content[0] ?? requirement.summary,
                    linkedRequirementIds: [requirement.id],
                    actors: [],
                    dependencies: []
                });
                await getDiagramElementsByBackend(backend.id);
                return created;
            }}
            onCreateActivityDiagram={async (requirement, useCaseDiagram) => {
                const created = await createDiagramElement({
                    backendId: backend.id,
                    specSectionId: requirement.id,
                    type: "activity",
                    slug: `${useCaseDiagram.slug}-activity`,
                    name: `${requirement.title} Activity`,
                    summary: requirement.summary,
                    description: requirement.content[0] ?? requirement.summary,
                    linkedRequirementIds: [requirement.id],
                    linkedUseCaseSlug: useCaseDiagram.slug
                });
                await getDiagramElementsByBackend(backend.id);
                return created;
            }}
            onEnsureUseCaseDiagramBinding={async (diagram, requirement) => {
                if (diagram.specSectionId === requirement.id) {
                    return;
                }

                await updateDiagramElement({
                    id: diagram.id,
                    specSectionId: requirement.id,
                    linkedRequirementIds: [requirement.id]
                });
                await getDiagramElementsByBackend(backend.id);
            }}
            onEnsureActivityDiagramBinding={async (diagram, requirement, useCaseDiagram) => {
                if (diagram.specSectionId === requirement.id && diagram.linkedUseCaseSlug === useCaseDiagram.slug) {
                    return;
                }

                await updateDiagramElement({
                    id: diagram.id,
                    specSectionId: requirement.id,
                    linkedRequirementIds: [requirement.id],
                    linkedUseCaseSlug: useCaseDiagram.slug
                });
                await getDiagramElementsByBackend(backend.id);
            }}
        />
    );
}

export default withAuth(BackendRequirementsPage, { roles: [...WORKFLOW_ROLES] });
