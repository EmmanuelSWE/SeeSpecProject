"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    BackendFormFields,
    type BackendFormState,
    BackendOverviewFormFields,
    type OverviewFormState,
    BackendRoleFormFields,
    type BackendRoleFormState
} from "@/app/components/app/backend-form-fields";
import { BackendModal } from "@/app/components/app/backend-modal";
import type {
    AllowedGenerationFolder,
    BackendRecord,
    BackendWorkflowReadiness,
    GenerationArtifactType
} from "@/app/lib/providers/backendProvider/context";
import type { GenerationRunMode, IGeneratedSpecPreview } from "@/app/lib/providers/specProvider/context";
import type { SpecSectionDto } from "@/app/lib/utils/services/spec-section-service";

type ModalState = "edit-backend" | "overview" | "role" | null;
const generationArtifactOptions: Array<{ value: GenerationArtifactType; label: string }> = [
    { value: 2, label: "App service class" },
    { value: 1, label: "App service interface" },
    { value: 3, label: "DTO" },
    { value: 4, label: "Repository" },
    { value: 5, label: "Domain entity" },
    { value: 6, label: "Permission seed" }
];
const generationRunModeOptions: Array<{ value: GenerationRunMode; label: string }> = [
    { value: 1, label: "Single artifact family" },
    { value: 2, label: "Full backend generation" }
];

function toBackendFormState(backend: BackendRecord): BackendFormState {
    return {
        name: backend.name,
        framework: backend.framework,
        runtimeVersion: backend.runtimeVersion,
        repositoryUrl: backend.repositoryUrl,
        description: backend.description,
        status: backend.status
    };
}

function toOverviewFormState(overviewSection: SpecSectionDto | null): OverviewFormState {
    return overviewSection
        ? {
              summary: overviewSection.content[0] ?? overviewSection.summary,
              scope: overviewSection.content[1] ?? "",
              goals: overviewSection.content[2] ?? "",
              isAccepted: overviewSection.isAccepted ?? false
          }
        : { summary: "", scope: "", goals: "", isAccepted: false };
}

export function BackendOverviewWorkspace({
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
    workflowReadiness,
    shouldPromptOverviewCreation,
    onOverviewPromptConsumed,
    onSelectGenerationRunMode,
    onSelectGenerationArtifactType,
    onSelectGenerationFolder,
    onGeneratePreview,
    onResolveMalformedRegions,
    onApplyGeneratedCode,
    onClearPreview
}: {
    backend: BackendRecord;
    overviewSection: SpecSectionDto | null;
    roleSections: SpecSectionDto[];
    canManageRoles: boolean;
    onSaveBackend: (next: BackendFormState) => Promise<void>;
    onSaveOverview: (next: OverviewFormState) => Promise<void>;
    onAcceptOverview: () => Promise<void>;
    onSaveRole: (role: BackendRoleFormState) => Promise<void>;
    generatedPreview: IGeneratedSpecPreview | null;
    isGeneratingPreview: boolean;
    previewErrorMessage: string | null;
    applyGeneratedCodeErrorMessage: string | null;
    isApplyingGeneratedCode: boolean;
    generationRunMode: GenerationRunMode;
    generationArtifactType: GenerationArtifactType;
    generationFolderOptions: AllowedGenerationFolder[];
    selectedGenerationFolderPath: string;
    isLoadingGenerationFolders: boolean;
    generationFolderErrorMessage: string | null;
    workflowReadiness: BackendWorkflowReadiness | null;
    shouldPromptOverviewCreation: boolean;
    onOverviewPromptConsumed: () => void;
    onSelectGenerationRunMode: (mode: GenerationRunMode) => void;
    onSelectGenerationArtifactType: (artifactType: GenerationArtifactType) => void;
    onSelectGenerationFolder: (folderPath: string) => void;
    onGeneratePreview: () => Promise<void>;
    onResolveMalformedRegions: (decision: number) => Promise<void>;
    onApplyGeneratedCode: (confirmOverwriteExisting: boolean) => Promise<void>;
    onClearPreview: () => void;
}) {
    const [modal, setModal] = useState<ModalState>(null);
    const [backendForm, setBackendForm] = useState<BackendFormState>(() => toBackendFormState(backend));
    const [overviewForm, setOverviewForm] = useState<OverviewFormState>(() => toOverviewFormState(overviewSection));
    const [roleForm, setRoleForm] = useState<BackendRoleFormState>({
        roleName: "Project Lead",
        assignedTo: "",
        emailAddress: "",
        note: ""
    });
    const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
    const [showApplyConfirmation, setShowApplyConfirmation] = useState(false);
    const [isSavingBackend, setIsSavingBackend] = useState(false);
    const [isSavingOverview, setIsSavingOverview] = useState(false);
    const [isAcceptingOverview, setIsAcceptingOverview] = useState(false);
    const [isSavingRole, setIsSavingRole] = useState(false);

    const hasOverview = Boolean(overviewSection);
    const isOverviewAccepted = overviewSection?.isAccepted ?? false;
    const canOpenDownstream = isOverviewAccepted;
    const projectRoles = useMemo(
        () =>
            roleSections.map((section) => ({
                id: section.id,
                roleName: section.title,
                assignedTo: section.sectionItems.find((item) => item.label === "assignedTo")?.content ?? "",
                emailAddress: section.sectionItems.find((item) => item.label === "emailAddress")?.content ?? "",
                note: section.sectionItems.find((item) => item.label === "note")?.content ?? ""
            })),
        [roleSections]
    );
    const summaryCards = useMemo(
        () => [
            { label: "Project roles", value: String(projectRoles.length) },
            { label: "Requirements", value: String(backend.requirements.length) },
            { label: "Overview gate", value: isOverviewAccepted ? "Accepted" : "Pending" },
            { label: "Code generation", value: workflowReadiness?.isCodeGenerationReady ? "Unlocked" : "Locked" }
        ],
        [backend.requirements.length, isOverviewAccepted, projectRoles.length, workflowReadiness?.isCodeGenerationReady]
    );

    useEffect(() => {
        if (!shouldPromptOverviewCreation || overviewSection) {
            return;
        }

        setActionErrorMessage(null);
        setOverviewForm(toOverviewFormState(overviewSection));
        setModal("overview");
        onOverviewPromptConsumed();
    }, [onOverviewPromptConsumed, overviewSection, shouldPromptOverviewCreation]);

    async function saveBackend() {
        setActionErrorMessage(null);
        setIsSavingBackend(true);
        try {
            await onSaveBackend(backendForm);
            setModal(null);
        } catch (error) {
            setActionErrorMessage(error instanceof Error ? error.message : "Unable to save backend details.");
        } finally {
            setIsSavingBackend(false);
        }
    }

    async function saveOverview() {
        setActionErrorMessage(null);
        setIsSavingOverview(true);
        try {
            await onSaveOverview(overviewForm);
            setModal(null);
        } catch (error) {
            setActionErrorMessage(error instanceof Error ? error.message : "Unable to save the overview.");
        } finally {
            setIsSavingOverview(false);
        }
    }

    async function saveRole() {
        setActionErrorMessage(null);
        setIsSavingRole(true);
        try {
            await onSaveRole(roleForm);
            setRoleForm({ roleName: "Project Lead", assignedTo: "", emailAddress: "", note: "" });
            setModal(null);
        } catch (error) {
            setActionErrorMessage(error instanceof Error ? error.message : "Unable to save the project role.");
        } finally {
            setIsSavingRole(false);
        }
    }

    return (
        <section className={`page-section backend-overview-page ${modal ? "backend-page-blurred" : ""}`}>
            <div className="card backend-hero-card">
                <div className="card-body backend-hero-body">
                    <div className="backend-hero-copy">
                        <span className="requirements-eyebrow">Backend Overview</span>
                        <h1>{backend.name}</h1>
                        <p>{backend.description}</p>
                    </div>
                    <div className="backend-hero-actions">
                        <button
                            type="button"
                            className="secondary-button"
                            disabled={isSavingBackend}
                            onClick={() => {
                                setActionErrorMessage(null);
                                setBackendForm(toBackendFormState(backend));
                                setModal("edit-backend");
                            }}
                        >
                            Edit backend
                        </button>
                        {canOpenDownstream ? (
                            <Link href={`/app/backends/${backend.slug}/requirements`} className="requirements-action-button">
                                Open requirements
                            </Link>
                        ) : (
                            <button type="button" className="requirements-action-button" disabled>
                                Open requirements
                            </button>
                        )}
                        {canOpenDownstream ? (
                            <Link href={`/app/backends/${backend.slug}/domain-model`} className="secondary-button">
                                Open domain model
                            </Link>
                        ) : (
                            <button type="button" className="secondary-button" disabled>
                                Open domain model
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {actionErrorMessage ? (
                <div className="backend-feedback-banner" role="alert">
                    <strong>Action failed.</strong>
                    <span>{actionErrorMessage}</span>
                </div>
            ) : null}

            <div className="backend-summary-grid">
                {summaryCards.map((card) => (
                    <div key={card.label} className="card backend-summary-card">
                        <div className="card-body">
                            <span>{card.label}</span>
                            <strong>{card.value}</strong>
                        </div>
                    </div>
                ))}
            </div>

            <div className="backend-overview-grid">
                <div className="card backend-overview-card">
                    <div className="card-header backend-table-header">
                        <div>
                            <span className="requirements-eyebrow">System Overview</span>
                            <h3>What the system should do</h3>
                        </div>
                        <button
                            type="button"
                            className="requirements-action-button"
                            disabled={isSavingOverview}
                            onClick={() => {
                                setActionErrorMessage(null);
                                setOverviewForm(toOverviewFormState(overviewSection));
                                setModal("overview");
                            }}
                        >
                            {hasOverview ? "Edit overview" : "Create overview"}
                        </button>
                    </div>
                    <div className="card-body backend-overview-body">
                        {overviewSection ? (
                            <>
                                <div className="backend-overview-copy">
                                    <strong>System summary</strong>
                                    <p>{overviewSection.content[0] ?? overviewSection.summary}</p>
                                </div>
                                <div className="backend-overview-copy">
                                    <strong>Scope</strong>
                                    <p>{overviewSection.content[1] ?? ""}</p>
                                </div>
                                <div className="backend-overview-copy">
                                    <strong>Goals</strong>
                                    <p>{overviewSection.content[2] ?? ""}</p>
                                </div>
                                <div className="backend-overview-copy">
                                    <strong>Overview gate</strong>
                                    <p>{isOverviewAccepted ? "Accepted. Downstream analysis and diagrams may continue." : "Pending acceptance. Downstream analysis and diagrams stay blocked."}</p>
                                </div>
                            </>
                        ) : (
                            <div className="backend-blocked-state">
                                <strong>Overview required</strong>
                                <p>
                                    Define the backend overview first. Requirements, diagrams, and project role work stay
                                    disabled until the system overview is created.
                                </p>
                            </div>
                        )}
                    </div>
                    {overviewSection && !isOverviewAccepted ? (
                        <div className="card-footer requirements-panel-footer">
                            <button
                                type="button"
                                className="requirements-action-button"
                                disabled={isAcceptingOverview}
                                onClick={async () => {
                                    setActionErrorMessage(null);
                                    setIsAcceptingOverview(true);
                                    try {
                                        await onAcceptOverview();
                                    } catch (error) {
                                        setActionErrorMessage(
                                            error instanceof Error ? error.message : "Unable to accept the overview."
                                        );
                                    } finally {
                                        setIsAcceptingOverview(false);
                                    }
                                }}
                            >
                                {isAcceptingOverview ? "Accepting..." : "Accept overview"}
                            </button>
                        </div>
                    ) : null}
                </div>

                <div className="card backend-role-card">
                    <div className="card-header backend-table-header">
                        <div>
                            <span className="requirements-eyebrow">Project Roles</span>
                            <h3>Assigned workspace roles</h3>
                        </div>
                        <button
                            type="button"
                            className="requirements-action-button"
                            disabled={!hasOverview || !canManageRoles || isSavingRole}
                            onClick={() => {
                                setActionErrorMessage(null);
                                setModal("role");
                            }}
                        >
                            Add role
                        </button>
                    </div>
                    <div className="card-body backend-role-body">
                        {!hasOverview ? (
                            <div className="backend-blocked-state">
                                <strong>Role setup is locked</strong>
                                <p>Create the overview first, then assign the project roles for this backend.</p>
                            </div>
                        ) : projectRoles.length === 0 ? (
                            <div className="backend-blocked-state">
                                <strong>No roles configured yet</strong>
                                <p>
                                    {canManageRoles
                                        ? "Add the tenant admin, project lead, business analyst, and system architect as needed."
                                        : "Role persistence is waiting on a dedicated backend endpoint, so this area is read-only for now."}
                                </p>
                            </div>
                        ) : (
                            <div className="backend-role-list">
                                {projectRoles.map((role) => (
                                    <article key={role.id} className="backend-role-item">
                                        <div className="backend-role-heading">
                                            <strong>{role.roleName}</strong>
                                            <span>{role.emailAddress}</span>
                                        </div>
                                        <p>{role.assignedTo}</p>
                                        <small>{role.note}</small>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {workflowReadiness && !workflowReadiness.isCodeGenerationReady ? (
                <div className="card backend-overview-card">
                    <div className="card-header backend-table-header">
                        <div>
                            <span className="requirements-eyebrow">Code Generation</span>
                            <h3>Complete the workflow to unlock code generation</h3>
                        </div>
                    </div>
                    <div className="card-body backend-overview-body">
                        <div className="backend-blocked-state">
                            <strong>Code generation is hidden until the backend is fully prepared.</strong>
                            <p>Complete the missing workflow items below to unlock code generation.</p>
                        </div>
                        <div className="backend-role-list">
                            {workflowReadiness.missingItems.map((missingItem) => (
                                <article key={missingItem} className="backend-role-item">
                                    <div className="backend-role-heading">
                                        <strong>Missing workflow item</strong>
                                    </div>
                                    <p>{missingItem}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}

            {workflowReadiness?.isCodeGenerationReady ? (
            <div className="card backend-overview-card">
                <div className="card-header backend-table-header">
                    <div>
                        <span className="requirements-eyebrow">AI Preview</span>
                        <h3>Inspect raw generation output</h3>
                    </div>
                    <div className="backend-hero-actions">
                        <button type="button" className="secondary-button" onClick={onClearPreview} disabled={!generatedPreview && !previewErrorMessage}>
                            Clear
                        </button>
                        <button
                            type="button"
                            className="requirements-action-button"
                            onClick={async () => {
                                setActionErrorMessage(null);
                                try {
                                    await onGeneratePreview();
                                } catch (error) {
                                    setActionErrorMessage(
                                        error instanceof Error ? error.message : "Unable to generate the AI preview."
                                    );
                                }
                            }}
                            disabled={
                                isGeneratingPreview
                                || isLoadingGenerationFolders
                                || (generationRunMode === 1 && !selectedGenerationFolderPath)
                            }
                        >
                            {isGeneratingPreview ? "Generating..." : "Generate preview"}
                        </button>
                    </div>
                </div>
                <div className="card-body backend-overview-body">
                    <div className="backend-overview-copy">
                        <strong>Status</strong>
                        <p>
                            {isGeneratingPreview
                                ? "Building the prompt from the backend spec and requesting raw AI output."
                                : generatedPreview
                                  ? generatedPreview.hasAppliedArtifacts
                                      ? "Preview remains visible below and the staged generation has already been applied to the backend."
                                      : "Preview and staged generation are available below. No backend files have been written yet."
                                : "Generate a preview to inspect the backend-built prompt, staged artifact set, and raw AI response before writing code."}
                        </p>
                    </div>
                    <div className="backend-overview-copy">
                        <strong>Generation mode</strong>
                        <label className="backend-inline-field">
                            <span>Generation scope</span>
                            <select
                                className="backend-inline-select"
                                value={generationRunMode}
                                onChange={(event) => onSelectGenerationRunMode(Number(event.target.value) as GenerationRunMode)}
                                disabled={isGeneratingPreview || isApplyingGeneratedCode}
                            >
                                {generationRunModeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <p>
                            Full backend generation follows template-defined folder standards automatically. Single artifact family lets you inspect one family at a chosen approved target folder first.
                        </p>
                    </div>
                    <div className="backend-overview-copy">
                        <strong>Target artifact</strong>
                        <label className="backend-inline-field">
                            <span>Artifact type</span>
                            <select
                                className="backend-inline-select"
                                value={generationArtifactType}
                                onChange={(event) =>
                                    onSelectGenerationArtifactType(Number(event.target.value) as GenerationArtifactType)
                                }
                                disabled={isGeneratingPreview || isApplyingGeneratedCode || generationRunMode === 2}
                            >
                                {generationArtifactOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {generationRunMode === 1 ? (
                            <label className="backend-inline-field">
                                <span>Approved target folder</span>
                                <select
                                    className="backend-inline-select"
                                    value={selectedGenerationFolderPath}
                                    onChange={(event) => onSelectGenerationFolder(event.target.value)}
                                    disabled={isGeneratingPreview || isApplyingGeneratedCode || isLoadingGenerationFolders || generationFolderOptions.length === 0}
                                >
                                    <option value="">
                                        {isLoadingGenerationFolders
                                            ? "Loading approved folders..."
                                            : generationFolderOptions.length === 0
                                              ? "No approved folders available"
                                              : "Select an approved folder"}
                                    </option>
                                    {generationFolderOptions.map((folder) => (
                                        <option key={folder.folderPath} value={folder.folderPath}>
                                            {folder.projectName}: {folder.folderPath}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : null}
                        <p>
                            {generationRunMode === 1
                                ? "The backend resolves the allowed folders. Preview content is staged only against the selected approved target path."
                                : "The backend auto-resolves each artifact family folder from the template and standards rules for the imported backend structure."}
                        </p>
                    </div>
                    {generationFolderErrorMessage ? (
                        <div className="backend-blocked-state">
                            <strong>Folder discovery failed</strong>
                            <p>{generationFolderErrorMessage}</p>
                        </div>
                    ) : null}
                    {previewErrorMessage ? (
                        <div className="backend-blocked-state">
                            <strong>Preview failed</strong>
                            <p>{previewErrorMessage}</p>
                        </div>
                    ) : null}
                    {applyGeneratedCodeErrorMessage ? (
                        <div className="backend-blocked-state">
                            <strong>Code generation failed</strong>
                            <p>{applyGeneratedCodeErrorMessage}</p>
                        </div>
                    ) : null}
                    {generatedPreview ? (
                        <div className="backend-role-list">
                            <article className="backend-role-item">
                                <div className="backend-role-heading">
                                    <strong>Model</strong>
                                    <span>{generatedPreview.model}</span>
                                </div>
                                <p>{new Date(generatedPreview.timestamp).toLocaleString()}</p>
                                <small>
                                    Input tokens: {generatedPreview.usage?.inputTokens ?? "n/a"} | Output tokens: {generatedPreview.usage?.outputTokens ?? "n/a"}
                                </small>
                            </article>
                            <article className="backend-role-item">
                                <div className="backend-role-heading">
                                    <strong>Prompt</strong>
                                </div>
                                <pre className="semantic-diagram-editor-status">{generatedPreview.prompt}</pre>
                            </article>
                            <article className="backend-role-item">
                                <div className="backend-role-heading">
                                    <strong>Raw output</strong>
                                </div>
                                <pre className="semantic-diagram-editor-status">{generatedPreview.outputText}</pre>
                            </article>
                            {generatedPreview.artifacts?.map((artifact) => (
                                <article key={artifact.targetFilePath} className="backend-role-item">
                                    <div className="backend-role-heading">
                                        <strong>Prepared artifact</strong>
                                        <span>
                                            {artifact.applyStatus === 4
                                                ? "Written"
                                                : artifact.applyStatus === 2
                                                  ? "Overwrite confirmation needed"
                                                  : artifact.applyStatus === 3
                                                    ? "Blocked by dependency"
                                                    : artifact.targetExists
                                                      ? "Existing target detected"
                                                      : "New target"}
                                        </span>
                                    </div>
                                    <p>{artifact.targetFilePath}</p>
                                    {artifact.requiresMalformedRegionDecision && artifact.malformedRegionWarning ? (
                                        <div className="backend-blocked-state">
                                            <strong>Protected regions need review</strong>
                                            <p>{artifact.malformedRegionWarning.message}</p>
                                            {artifact.malformedRegionWarning.affectedRegionNames.length > 0 ? (
                                                <small>
                                                    Affected regions: {artifact.malformedRegionWarning.affectedRegionNames.join(", ")}
                                                </small>
                                            ) : null}
                                            <div className="backend-hero-actions">
                                                <button
                                                    type="button"
                                                    className="requirements-action-button"
                                                    disabled={isGeneratingPreview}
                                                    onClick={async () => {
                                                        setActionErrorMessage(null);
                                                        try {
                                                            await onResolveMalformedRegions(1);
                                                        } catch (error) {
                                                            setActionErrorMessage(
                                                                error instanceof Error
                                                                    ? error.message
                                                                    : "Unable to continue with protected-region repair."
                                                            );
                                                        }
                                                    }}
                                                >
                                                    Repair and continue
                                                </button>
                                                <button
                                                    type="button"
                                                    className="secondary-button"
                                                    disabled={isGeneratingPreview}
                                                    onClick={async () => {
                                                        setActionErrorMessage(null);
                                                        try {
                                                            await onResolveMalformedRegions(2);
                                                        } catch (error) {
                                                            setActionErrorMessage(
                                                                error instanceof Error
                                                                    ? error.message
                                                                    : "Unable to preserve conflicted manual code."
                                                            );
                                                        }
                                                    }}
                                                >
                                                    Preserve at file end
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <small>
                                            Workspace: {artifact.workspaceKey} | {artifact.targetExists ? (artifact.hasMeaningfulDifference ? "Existing file differs" : "Existing file already matches") : "New file"}
                                        </small>
                                    )}
                                    {artifact.malformedRegionWarning && !artifact.requiresMalformedRegionDecision ? (
                                        <small>{artifact.malformedRegionWarning.message}</small>
                                    ) : null}
                                </article>
                            ))}
                            {!generatedPreview.artifacts?.some((artifact) => artifact.requiresMalformedRegionDecision) ? (
                                <article className="backend-role-item">
                                    <div className="backend-role-heading">
                                        <strong>Generate code</strong>
                                        <span>{generatedPreview.hasAppliedArtifacts ? "Applied" : "Awaiting confirmation"}</span>
                                    </div>
                                    <p>
                                        {generatedPreview.hasAppliedArtifacts
                                            ? "The staged artifact set remains visible for review. Existing files that differed may still require overwrite approval if they were held."
                                            : "Confirm to write the staged artifact set into the approved backend folders. This does not change the preview text shown above."}
                                    </p>
                                    <div className="backend-hero-actions">
                                                <button
                                                    type="button"
                                                    className="requirements-action-button"
                                                    disabled={isGeneratingPreview || isApplyingGeneratedCode}
                                                    onClick={() => setShowApplyConfirmation(true)}
                                                >
                                                    {isApplyingGeneratedCode ? "Generating code..." : "Generate code"}
                                                </button>
                                        {generatedPreview.artifacts?.some((artifact) => artifact.applyStatus === 2) ? (
                                            <button
                                                type="button"
                                                className="secondary-button"
                                                disabled={isGeneratingPreview || isApplyingGeneratedCode}
                                                onClick={async () => {
                                                    setActionErrorMessage(null);
                                                    try {
                                                        await onApplyGeneratedCode(true);
                                                    } catch (error) {
                                                        setActionErrorMessage(
                                                            error instanceof Error ? error.message : "Unable to confirm overwrite for staged code."
                                                        );
                                                    }
                                                }}
                                            >
                                                Confirm overwrite for held files
                                            </button>
                                        ) : null}
                                    </div>
                                    {showApplyConfirmation ? (
                                        <div className="backend-blocked-state">
                                            <strong>Confirm code generation</strong>
                                            <p>
                                                This will write every currently staged artifact that is eligible to be applied now. Existing files with differences may still pause for overwrite confirmation.
                                            </p>
                                            <div className="backend-hero-actions">
                                                <button
                                                    type="button"
                                                    className="secondary-button"
                                                    onClick={() => setShowApplyConfirmation(false)}
                                                    disabled={isApplyingGeneratedCode}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="requirements-action-button"
                                                    disabled={isApplyingGeneratedCode}
                                                    onClick={async () => {
                                                        setActionErrorMessage(null);
                                                        try {
                                                            await onApplyGeneratedCode(false);
                                                            setShowApplyConfirmation(false);
                                                        } catch (error) {
                                                            setActionErrorMessage(
                                                                error instanceof Error ? error.message : "Unable to apply generated code."
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {isApplyingGeneratedCode ? "Applying..." : "Confirm generate code"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}
                                </article>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
            ) : null}

            {modal === "edit-backend" ? (
                <BackendModal title="Edit backend" description="Update the backend metadata while keeping the current workspace routing intact." onClose={() => setModal(null)}>
                    <BackendFormFields value={backendForm} onChange={setBackendForm} />
                    <div className="backend-modal-actions">
                        <button type="button" className="secondary-button" onClick={() => setModal(null)}>
                            Cancel
                        </button>
                        <button type="button" className="requirements-action-button" onClick={saveBackend} disabled={isSavingBackend}>
                            {isSavingBackend ? "Saving..." : "Save backend"}
                        </button>
                    </div>
                </BackendModal>
            ) : null}

            {modal === "overview" ? (
                <BackendModal title={hasOverview ? "Edit system overview" : "Create system overview"} description="This overview gates the rest of the backend workspace." onClose={() => setModal(null)}>
                    <BackendOverviewFormFields value={overviewForm} onChange={setOverviewForm} />
                    <div className="backend-modal-actions">
                        <button type="button" className="secondary-button" onClick={() => setModal(null)}>
                            Cancel
                        </button>
                        <button type="button" className="requirements-action-button" onClick={saveOverview} disabled={isSavingOverview}>
                            {isSavingOverview ? "Saving..." : "Save overview"}
                        </button>
                    </div>
                </BackendModal>
            ) : null}

            {modal === "role" ? (
                <BackendModal title="Add project role" description="Define the people responsible for this backend before continuing into requirements and diagrams." onClose={() => setModal(null)}>
                    <BackendRoleFormFields value={roleForm} onChange={setRoleForm} />
                    <div className="backend-modal-actions">
                        <button type="button" className="secondary-button" onClick={() => setModal(null)}>
                            Cancel
                        </button>
                        <button type="button" className="requirements-action-button" onClick={saveRole} disabled={isSavingRole}>
                            {isSavingRole ? "Saving..." : "Save role"}
                        </button>
                    </div>
                </BackendModal>
            ) : null}
        </section>
    );
}
