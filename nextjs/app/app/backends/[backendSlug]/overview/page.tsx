"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { BackendOverviewWorkspace } from "@/app/components/app/backend-overview-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useSpecSectionActions, useSpecSectionState } from "@/app/lib/providers/specSectionProvider";
import {
    createSectionItem,
    updateSectionItem
} from "@/app/lib/utils/services/section-item-service";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendOverviewPage() {
    const params = useParams<{ backendSlug: string }>();
    const { session } = useUserState();
    const { backend } = useBackendState();
    const { sections } = useSpecSectionState();
    const { getBackendBySlug, updateBackend } = useBackendActions();
    const { getSectionsByBackend, createSection, updateSection } = useSpecSectionActions();

    useEffect(() => {
        getBackendBySlug(params.backendSlug).catch(() => {});
    }, [getBackendBySlug, params.backendSlug]);

    useEffect(() => {
        if (backend) {
            getSectionsByBackend(backend.id).catch(() => {});
        }
    }, [backend, getSectionsByBackend]);

    const overviewSection =
        sections.find((item) => item.type === "overview" && item.slug === `${backend?.slug ?? ""}-overview`) ??
        sections.find((item) => item.type === "overview") ??
        null;
    const roleSections = sections.filter((item) => item.type === "role");

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
            overviewSection={overviewSection}
            roleSections={roleSections}
            canManageRoles={true}
            onSaveBackend={async (payload) => {
                await updateBackend({ id: backend.id, ...payload });
            }}
            onSaveOverview={async (payload) => {
                // Overview is a singleton per backend, so edit must always bind to the existing section identity.
                const existingOverview =
                    sections.find((item) => item.type === "overview" && item.slug === `${backend.slug}-overview`) ??
                    sections.find((item) => item.type === "overview") ??
                    null;

                if (existingOverview) {
                    await updateSection({
                        id: existingOverview.id,
                        title: `${backend.name} Overview`,
                        summary: payload.summary,
                        content: [payload.summary, payload.scope, payload.goals]
                    });
                    await getSectionsByBackend(backend.id);
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
                await getSectionsByBackend(backend.id);
            }}
            onSaveRole={async (role) => {
                // Roles are stored in the spec model as Shared SpecSections, and the editable role details live in SectionItems.
                const createdRoleSection = await createSection({
                    backendId: backend.id,
                    type: "role",
                    title: role.roleName,
                    summary: role.note || role.assignedTo || role.roleName,
                    content: [role.note || role.assignedTo || role.roleName],
                    tags: ["Role", role.roleName, backend.name]
                });

                const existingItems = createdRoleSection.sectionItems;
                const roleItemPayloads = [
                    { label: "assignedTo", content: role.assignedTo, position: 1 },
                    { label: "emailAddress", content: role.emailAddress, position: 2 },
                    { label: "note", content: role.note, position: 3 }
                ] as const;

                await Promise.all(
                    roleItemPayloads.map(async (item) => {
                        const existingItem = existingItems.find((entry) => entry.label === item.label) ?? null;
                        if (existingItem) {
                            await updateSectionItem({
                                id: existingItem.id,
                                content: item.content,
                                position: item.position
                            });
                            return;
                        }

                        await createSectionItem({
                            specSectionId: createdRoleSection.id,
                            label: item.label,
                            content: item.content,
                            position: item.position
                        });
                    })
                );
                await getSectionsByBackend(backend.id);
            }}
        />
    );
}
