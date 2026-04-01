"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
    BackendFormFields,
    type BackendFormState,
    BackendOverviewFormFields,
    type OverviewFormState,
    BackendRoleFormFields,
    type BackendRoleFormState
} from "@/app/components/app/backend-form-fields";
import { BackendModal } from "@/app/components/app/backend-modal";
import type { BackendRecord } from "@/app/lib/providers/backendProvider/context";
import type { IGeneratedSpecPreview } from "@/app/lib/providers/specProvider/context";
import type { SpecSectionDto } from "@/app/lib/utils/services/spec-section-service";

type ModalState = "edit-backend" | "overview" | "role" | null;

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
    onGeneratePreview,
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
    onGeneratePreview: () => Promise<void>;
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

    const hasOverview = Boolean(overviewSection);
    const isOverviewAccepted = overviewSection?.isAccepted ?? false;
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
            { label: "Overview gate", value: isOverviewAccepted ? "Accepted" : "Pending" }
        ],
        [backend.requirements.length, isOverviewAccepted, projectRoles.length]
    );

    async function saveBackend() {
        await onSaveBackend(backendForm);
        setModal(null);
    }

    async function saveOverview() {
        await onSaveOverview(overviewForm);
        setModal(null);
    }

    async function saveRole() {
        await onSaveRole(roleForm);
        setRoleForm({ roleName: "Project Lead", assignedTo: "", emailAddress: "", note: "" });
        setModal(null);
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
                            onClick={() => {
                                setBackendForm(toBackendFormState(backend));
                                setModal("edit-backend");
                            }}
                        >
                            Edit backend
                        </button>
                        <Link
                            href={isOverviewAccepted ? `/app/backends/${backend.slug}/requirements` : "#"}
                            className={`requirements-action-button ${isOverviewAccepted ? "" : "is-disabled-link"}`}
                            aria-disabled={!isOverviewAccepted}
                            onClick={(event) => {
                                if (!isOverviewAccepted) {
                                    event.preventDefault();
                                }
                            }}
                        >
                            Open requirements
                        </Link>
                        <Link
                            href={isOverviewAccepted ? `/app/backends/${backend.slug}/domain-model` : "#"}
                            className={`secondary-button ${isOverviewAccepted ? "" : "is-disabled-link"}`}
                            aria-disabled={!isOverviewAccepted}
                            onClick={(event) => {
                                if (!isOverviewAccepted) {
                                    event.preventDefault();
                                }
                            }}
                        >
                            Open domain model
                        </Link>
                    </div>
                </div>
            </div>

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
                            onClick={() => {
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
                            <button type="button" className="requirements-action-button" onClick={() => { onAcceptOverview().catch(() => {}); }}>
                                Accept overview
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
                        <button type="button" className="requirements-action-button" disabled={!hasOverview || !canManageRoles} onClick={() => setModal("role")}>
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
                        <button type="button" className="requirements-action-button" onClick={() => { onGeneratePreview().catch(() => {}); }} disabled={isGeneratingPreview}>
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
                                  ? "Raw preview is available below. This output is not persisted."
                                  : "Generate a preview to inspect the backend-built prompt and raw AI response."}
                        </p>
                    </div>
                    {previewErrorMessage ? (
                        <div className="backend-blocked-state">
                            <strong>Preview failed</strong>
                            <p>{previewErrorMessage}</p>
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
                        </div>
                    ) : null}
                </div>
            </div>

            {modal === "edit-backend" ? (
                <BackendModal title="Edit backend" description="Update the backend metadata while keeping the current workspace routing intact." onClose={() => setModal(null)}>
                    <BackendFormFields value={backendForm} onChange={setBackendForm} />
                    <div className="backend-modal-actions">
                        <button type="button" className="secondary-button" onClick={() => setModal(null)}>
                            Cancel
                        </button>
                        <button type="button" className="requirements-action-button" onClick={saveBackend}>
                            Save backend
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
                        <button type="button" className="requirements-action-button" onClick={saveOverview}>
                            Save overview
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
                        <button type="button" className="requirements-action-button" onClick={saveRole}>
                            Save role
                        </button>
                    </div>
                </BackendModal>
            ) : null}
        </section>
    );
}
