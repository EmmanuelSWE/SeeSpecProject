"use client";

import { BackendOverviewWorkspace } from "@/app/components/app/backend-overview-workspace";
import type { IBackendStateContext } from "@/app/lib/providers/backendProvider/context";
import type { ISpecSectionStateContext } from "@/app/lib/providers/specSectionProvider/context";

type BackendRecord = NonNullable<IBackendStateContext["backend"]>;
type SpecSectionRecord = ISpecSectionStateContext["sections"][number];

export function BackendOverviewPageClient({
    backend,
    overviewSection,
    roleSections,
    canManageRoles,
    onSaveBackend,
    onSaveOverview,
    onSaveRole
}: {
    backend: BackendRecord;
    overviewSection: SpecSectionRecord | null;
    roleSections: SpecSectionRecord[];
    canManageRoles: boolean;
    onSaveBackend: React.ComponentProps<typeof BackendOverviewWorkspace>["onSaveBackend"];
    onSaveOverview: React.ComponentProps<typeof BackendOverviewWorkspace>["onSaveOverview"];
    onSaveRole: React.ComponentProps<typeof BackendOverviewWorkspace>["onSaveRole"];
}) {
    // Compatibility export: the overview page now renders directly, but keeping this file prevents stale build references from failing.
    return (
        <BackendOverviewWorkspace
            backend={backend}
            overviewSection={overviewSection}
            roleSections={roleSections}
            canManageRoles={canManageRoles}
            onSaveBackend={onSaveBackend}
            onSaveOverview={onSaveOverview}
            onSaveRole={onSaveRole}
        />
    );
}
