"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { BackendRequirementsWorkspace } from "@/app/components/app/backend-requirements-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useDiagramElementActions, useDiagramElementState } from "@/app/lib/providers/diagramElementProvider";
import { useSpecSectionActions, useSpecSectionState } from "@/app/lib/providers/specSectionProvider";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendRequirementsPage() {
    const params = useParams<{ backendSlug: string }>();
    const { session } = useUserState();
    const { backend } = useBackendState();
    const { sections } = useSpecSectionState();
    const { diagramElements } = useDiagramElementState();
    const { getBackendBySlug } = useBackendActions();
    const { createDiagramElement, getDiagramElementsByBackend, updateDiagramElement } = useDiagramElementActions();
    const { createSection, getSectionsByBackend, updateSection } = useSpecSectionActions();
    const backendId = backend?.id ?? null;

    useEffect(() => {
        getBackendBySlug(params.backendSlug).catch(() => {});
    }, [params.backendSlug, getBackendBySlug]);

    useEffect(() => {
        if (backendId !== null) {
            getSectionsByBackend(backendId).catch(() => {});
            getDiagramElementsByBackend(backendId).catch(() => {});
        }
    }, [backendId, getDiagramElementsByBackend, getSectionsByBackend]);

    if (!hasPermission(session, APP_PERMISSIONS.requirements)) {
        return <AccessPanel title="Requirements" message="Your current role does not allow access to backend requirements." />;
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

    // Roles stay on the overview page only; requirements only consume the real overview section for gating.
    const overviewSection =
        sections.find((item) => item.type === "overview" && item.slug === `${backend.slug}-overview`) ??
        sections.find((item) => item.type === "overview") ??
        null;
    const requirementSections = sections.filter((item) => item.type === "requirement");

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
