"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { BackendOverviewWorkspace } from "@/app/components/app/backend-overview-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useSpecSectionActions, useSpecSectionState } from "@/app/lib/providers/specSectionProvider";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendOverviewPage() {
    const params = useParams<{ backendSlug: string }>();
    const { session } = useUserState();
    const { backend } = useBackendState();
    const { section, sections } = useSpecSectionState();
    const { getBackendBySlug, updateBackend } = useBackendActions();
    const { getSectionsByBackendAndType, createSection, updateSection } = useSpecSectionActions();

    useEffect(() => {
        getBackendBySlug(params.backendSlug).catch(() => {});
    }, [getBackendBySlug, params.backendSlug]);

    useEffect(() => {
        if (backend) {
            getSectionsByBackendAndType(backend.id, "overview").catch(() => {});
        }
    }, [backend, getSectionsByBackendAndType]);

    if (!hasPermission(session, APP_PERMISSIONS.backends)) {
        return <AccessPanel title="Backends" message="Your current role does not allow access to backend workspaces." />;
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

    return (
        <BackendOverviewWorkspace
            backend={backend}
            overviewSection={section ?? sections[0] ?? null}
            canManageRoles={false}
            onSaveBackend={async (payload) => {
                await updateBackend({ id: backend.id, ...payload });
            }}
            onSaveOverview={async (payload) => {
                const existingOverview = section ?? sections[0] ?? null;

                if (existingOverview) {
                    await updateSection({
                        id: existingOverview.id,
                        summary: payload.summary,
                        content: [payload.summary, payload.scope, payload.goals]
                    });
                    await getSectionsByBackendAndType(backend.id, "overview");
                    return;
                }

                await createSection({
                    backendId: backend.id,
                    type: "overview",
                    title: `${backend.name} Overview`,
                    summary: payload.summary,
                    content: [payload.summary, payload.scope, payload.goals],
                    tags: ["Overview", backend.name]
                });
                await getSectionsByBackendAndType(backend.id, "overview");
            }}
            onSaveRole={async (role) => {
                await updateBackend({
                    id: backend.id,
                    roles: [...backend.roles, { id: `role-${Date.now()}`, ...role }]
                });
            }}
        />
    );
}
