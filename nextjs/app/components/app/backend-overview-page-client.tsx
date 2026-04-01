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
    onAcceptOverview,
    onSaveRole,
    generatedPreview,
    isGeneratingPreview,
    previewErrorMessage,
    onGeneratePreview,
    onClearPreview
}: {
    backend: BackendRecord;
    overviewSection: SpecSectionRecord | null;
    roleSections: SpecSectionRecord[];
    canManageRoles: boolean;
    onSaveBackend: React.ComponentProps<typeof BackendOverviewWorkspace>["onSaveBackend"];
    onSaveOverview: React.ComponentProps<typeof BackendOverviewWorkspace>["onSaveOverview"];
    onAcceptOverview: React.ComponentProps<typeof BackendOverviewWorkspace>["onAcceptOverview"];
    onSaveRole: React.ComponentProps<typeof BackendOverviewWorkspace>["onSaveRole"];
    generatedPreview: React.ComponentProps<typeof BackendOverviewWorkspace>["generatedPreview"];
    isGeneratingPreview: React.ComponentProps<typeof BackendOverviewWorkspace>["isGeneratingPreview"];
    previewErrorMessage: React.ComponentProps<typeof BackendOverviewWorkspace>["previewErrorMessage"];
    onGeneratePreview: React.ComponentProps<typeof BackendOverviewWorkspace>["onGeneratePreview"];
    onClearPreview: React.ComponentProps<typeof BackendOverviewWorkspace>["onClearPreview"];
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
            onAcceptOverview={onAcceptOverview}
            onSaveRole={onSaveRole}
            generatedPreview={generatedPreview}
            isGeneratingPreview={isGeneratingPreview}
            previewErrorMessage={previewErrorMessage}
            onGeneratePreview={onGeneratePreview}
            onClearPreview={onClearPreview}
        />
    );
}
