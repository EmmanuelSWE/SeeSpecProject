"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { DomainModelWorkspace } from "@/app/components/app/domain-model-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useDiagramElementActions, useDiagramElementState } from "@/app/lib/providers/diagramElementProvider";
import { useSpecActions, useSpecState } from "@/app/lib/providers/specProvider";
import { useSpecSectionActions, useSpecSectionState } from "@/app/lib/providers/specSectionProvider";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendDomainModelPage() {
    const params = useParams<{ backendSlug: string }>();
    const { session } = useUserState();
    const { backend } = useBackendState();
    const { spec } = useSpecState();
    const { sections } = useSpecSectionState();
    const { diagramElements } = useDiagramElementState();
    const { getBackendBySlug } = useBackendActions();
    const { createDiagramElement, getDiagramElementsByBackendAndType } = useDiagramElementActions();
    const { getSpecByBackend } = useSpecActions();
    const { getSectionsByBackend } = useSpecSectionActions();

    useEffect(() => {
        getBackendBySlug(params.backendSlug).catch(() => {});
    }, [getBackendBySlug, params.backendSlug]);

    useEffect(() => {
        if (backend) {
            getSpecByBackend(backend.id).catch(() => {});
            getSectionsByBackend(backend.id).catch(() => {});
            getDiagramElementsByBackendAndType(backend.id, "domain-model").catch(() => {});
        }
    }, [backend?.id, getDiagramElementsByBackendAndType, getSectionsByBackend, getSpecByBackend]);

    if (!hasPermission(session, APP_PERMISSIONS.domainModel)) {
        return <AccessPanel title="Domain model" message="Your current role does not allow access to the domain model." />;
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

    const overviewSection =
        sections.find((item) => item.specId === spec?.id && item.type === "overview" && item.slug === `${backend.slug}-overview`) ??
        sections.find((item) => item.specId === spec?.id && item.type === "overview") ??
        null;

    return (
        <DomainModelWorkspace
            backend={backend}
            diagram={diagramElements[0] ?? null}
            onCreateDiagram={async () => {
                if (!overviewSection) {
                    return;
                }

                await createDiagramElement({
                    backendId: backend.id,
                    specSectionId: overviewSection.id,
                    type: "domain-model",
                    slug: `${backend.slug}-domain-model`,
                    name: `${backend.name} Domain Model`,
                    summary: overviewSection.summary,
                    description: overviewSection.summary,
                    entities: [],
                    relationships: []
                });
                await getDiagramElementsByBackendAndType(backend.id, "domain-model");
            }}
        />
    );
}
