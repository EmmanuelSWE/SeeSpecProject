"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { BackendRequirementsWorkspace } from "@/app/components/app/backend-requirements-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useSpecSectionActions, useSpecSectionState } from "@/app/lib/providers/specSectionProvider";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendRequirementsPage() {
    const params = useParams<{ backendSlug: string }>();
    const { session } = useUserState();
    const { backend } = useBackendState();
    const { sections } = useSpecSectionState();
    const { getBackendBySlug } = useBackendActions();
    const { createSection, getSectionsByBackendAndType, updateSection } = useSpecSectionActions();

    useEffect(() => {
        getBackendBySlug(params.backendSlug).catch(() => {});
    }, [params.backendSlug, getBackendBySlug]);

    useEffect(() => {
        if (backend) {
            getSectionsByBackendAndType(backend.id, "requirement").catch(() => {});
        }
    }, [backend?.id, getSectionsByBackendAndType]);

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

    return (
        <BackendRequirementsWorkspace
            backend={backend}
            overviewSection={backend.overview ? {
                id: `${backend.id}-overview`,
                backendId: backend.id,
                backendSlug: backend.slug,
                type: "overview",
                title: `${backend.name} Overview`,
                summary: backend.overview.summary,
                content: [backend.overview.summary, backend.overview.scope, backend.overview.goals],
                tags: ["Overview", backend.name],
                updatedAt: "Saved"
            } : null}
            requirementSections={sections}
            onCreateRequirement={async (payload) => {
                const created = await createSection(payload);
                await getSectionsByBackendAndType(backend.id, "requirement");
                return created;
            }}
            onUpdateRequirement={async (payload) => {
                await updateSection(payload);
                await getSectionsByBackendAndType(backend.id, "requirement");
            }}
        />
    );
}
