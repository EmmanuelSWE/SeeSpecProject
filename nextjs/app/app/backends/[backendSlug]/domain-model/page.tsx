"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { DomainModelWorkspace } from "@/app/components/app/domain-model-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useDiagramElementActions, useDiagramElementState } from "@/app/lib/providers/diagramElementProvider";
import { useSpecSectionActions, useSpecSectionState } from "@/app/lib/providers/specSectionProvider";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendDomainModelPage() {
    const params = useParams<{ backendSlug: string }>();
    const { session } = useUserState();
    const { backend } = useBackendState();
    const { sections } = useSpecSectionState();
    const { diagramElements } = useDiagramElementState();
    const { getBackendBySlug } = useBackendActions();
    const { getDiagramElementsByBackendAndType } = useDiagramElementActions();
    const { getSectionsByBackend } = useSpecSectionActions();
    const backendId = backend?.id ?? null;

    useEffect(() => {
        getBackendBySlug(params.backendSlug).catch(() => {});
    }, [getBackendBySlug, params.backendSlug]);

    useEffect(() => {
        if (backendId !== null) {
            getSectionsByBackend(backendId).catch(() => {});
            getDiagramElementsByBackendAndType(backendId, "domain-model").catch(() => {});
        }
    }, [backendId, getDiagramElementsByBackendAndType, getSectionsByBackend]);

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
        sections.find((item) => item.type === "overview" && item.slug === `${backend.slug}-overview`) ??
        sections.find((item) => item.type === "overview") ??
        null;

    if (!overviewSection || !overviewSection.isAccepted) {
        return (
            <section className="page-section">
                <div className="card backend-state-card">
                    <div className="card-body backend-blocked-state">
                        <strong>Overview acceptance required.</strong>
                        <p>Complete and accept the overview before opening the domain model step.</p>
                    </div>
                </div>
            </section>
        );
    }

    return <DomainModelWorkspace backend={backend} diagram={diagramElements[0] ?? null} />;
}
