"use client";

import { BackendOverviewWorkspace } from "@/app/components/app/backend-overview-workspace";
import type {
    AllowedGenerationFolder,
    GenerationArtifactType,
    IBackendStateContext
} from "@/app/lib/providers/backendProvider/context";
import type { GenerationRunMode } from "@/app/lib/providers/specProvider/context";
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
    applyGeneratedCodeErrorMessage,
    isApplyingGeneratedCode,
    generationRunMode,
    generationArtifactType,
    generationFolderOptions,
    selectedGenerationFolderPath,
    isLoadingGenerationFolders,
    generationFolderErrorMessage,
    onSelectGenerationRunMode,
    onSelectGenerationArtifactType,
    onSelectGenerationFolder,
    onGeneratePreview,
    onResolveMalformedRegions,
    onApplyGeneratedCode,
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
    applyGeneratedCodeErrorMessage?: React.ComponentProps<typeof BackendOverviewWorkspace>["applyGeneratedCodeErrorMessage"];
    isApplyingGeneratedCode?: React.ComponentProps<typeof BackendOverviewWorkspace>["isApplyingGeneratedCode"];
    generationRunMode?: GenerationRunMode;
    generationArtifactType?: GenerationArtifactType;
    generationFolderOptions?: AllowedGenerationFolder[];
    selectedGenerationFolderPath?: string;
    isLoadingGenerationFolders?: boolean;
    generationFolderErrorMessage?: string | null;
    onSelectGenerationRunMode?: (mode: GenerationRunMode) => void;
    onSelectGenerationArtifactType?: (artifactType: GenerationArtifactType) => void;
    onSelectGenerationFolder?: (folderPath: string) => void;
    onGeneratePreview: React.ComponentProps<typeof BackendOverviewWorkspace>["onGeneratePreview"];
    onResolveMalformedRegions?: React.ComponentProps<typeof BackendOverviewWorkspace>["onResolveMalformedRegions"];
    onApplyGeneratedCode?: React.ComponentProps<typeof BackendOverviewWorkspace>["onApplyGeneratedCode"];
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
            applyGeneratedCodeErrorMessage={applyGeneratedCodeErrorMessage ?? null}
            isApplyingGeneratedCode={isApplyingGeneratedCode ?? false}
            generationRunMode={generationRunMode ?? 1}
            generationArtifactType={generationArtifactType ?? 2}
            generationFolderOptions={generationFolderOptions ?? []}
            selectedGenerationFolderPath={selectedGenerationFolderPath ?? ""}
            isLoadingGenerationFolders={isLoadingGenerationFolders ?? false}
            generationFolderErrorMessage={generationFolderErrorMessage ?? null}
            onSelectGenerationRunMode={onSelectGenerationRunMode ?? (() => {})}
            onSelectGenerationArtifactType={onSelectGenerationArtifactType ?? (() => {})}
            onSelectGenerationFolder={onSelectGenerationFolder ?? (() => {})}
            onGeneratePreview={onGeneratePreview}
            onResolveMalformedRegions={onResolveMalformedRegions ?? (async () => {})}
            onApplyGeneratedCode={onApplyGeneratedCode ?? (async () => {})}
            onClearPreview={onClearPreview}
        />
    );
}
