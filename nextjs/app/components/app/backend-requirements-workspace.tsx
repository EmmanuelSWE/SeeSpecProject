"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BackendModal } from "@/app/components/app/backend-modal";
import { BackendRequirementFormFields, type BackendRequirementFormState } from "@/app/components/app/backend-form-fields";
import { RequirementsDetailPanel } from "@/app/components/app/requirements-detail-panel";
import { RequirementsSectionList, type RequirementSummary } from "@/app/components/app/requirements-section-list";
import { RequirementsTraceabilityPanel } from "@/app/components/app/requirements-traceability-panel";
import type { BackendDto } from "@/app/lib/utils/services/backend-service";
import type { DiagramElementDto } from "@/app/lib/utils/services/diagram-element-service";
import type { CreateSpecSectionInput, SpecSectionDto, UpdateSpecSectionInput } from "@/app/lib/utils/services/spec-section-service";

const EMPTY_REQUIREMENT_FORM: BackendRequirementFormState = {
    code: "",
    title: "",
    category: "",
    owner: "",
    priority: "High",
    summary: "",
    excerpt: "",
    acceptanceCriteria: ""
};

export function BackendRequirementsWorkspace({
    backend,
    overviewSection,
    requirementSections,
    useCaseDiagrams,
    activityDiagrams,
    onCreateRequirement,
    onUpdateRequirement,
    onCreateUseCaseDiagram,
    onCreateActivityDiagram,
    onEnsureUseCaseDiagramBinding,
    onEnsureActivityDiagramBinding
}: {
    backend: BackendDto;
    overviewSection: SpecSectionDto | null;
    requirementSections: SpecSectionDto[];
    useCaseDiagrams: DiagramElementDto[];
    activityDiagrams: DiagramElementDto[];
    onCreateRequirement: (payload: CreateSpecSectionInput) => Promise<SpecSectionDto>;
    onUpdateRequirement: (payload: UpdateSpecSectionInput) => Promise<void>;
    onCreateUseCaseDiagram: (requirement: SpecSectionDto) => Promise<DiagramElementDto>;
    onCreateActivityDiagram: (requirement: SpecSectionDto, useCaseDiagram: DiagramElementDto) => Promise<DiagramElementDto>;
    onEnsureUseCaseDiagramBinding: (diagram: DiagramElementDto, requirement: SpecSectionDto) => Promise<void>;
    onEnsureActivityDiagramBinding: (diagram: DiagramElementDto, requirement: SpecSectionDto, useCaseDiagram: DiagramElementDto) => Promise<void>;
}) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | "Draft" | "In Review" | "Approved">("All");
    const [selectedId, setSelectedId] = useState<string | null>(requirementSections[0]?.id ?? null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [requirementForm, setRequirementForm] = useState<BackendRequirementFormState>(EMPTY_REQUIREMENT_FORM);

    useEffect(() => {
        const timer = window.setTimeout(() => setIsLoading(false), 180);
        return () => window.clearTimeout(timer);
    }, []);

    const hasOverview = Boolean(overviewSection);
    const effectiveSelectedId =
        selectedId && requirementSections.some((requirement) => requirement.id === selectedId)
            ? selectedId
            : requirementSections[0]?.id ?? null;

    const filteredRequirements = useMemo(() => {
        return requirementSections.filter((item) => {
            const matchesQuery =
                !query ||
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                (item.code ?? "").toLowerCase().includes(query.toLowerCase()) ||
                item.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));

            const matchesStatus = statusFilter === "All" || item.status === statusFilter;
            return matchesQuery && matchesStatus;
        });
    }, [requirementSections, query, statusFilter]);

    const activeRequirement = filteredRequirements.find((item) => item.id === effectiveSelectedId) ?? null;

    async function saveRequirement() {
        const createdRequirement = await onCreateRequirement({
            backendId: backend.id,
            type: "requirement",
            code: requirementForm.code || `REQ-${requirementSections.length + 1}`,
            title: requirementForm.title,
            summary: requirementForm.summary,
            content: [requirementForm.summary],
            tags: [requirementForm.category, requirementForm.owner].filter(Boolean),
            category: requirementForm.category,
            owner: requirementForm.owner,
            status: "Draft",
            priority: requirementForm.priority,
            excerpt: requirementForm.excerpt,
            acceptanceCriteria: requirementForm.acceptanceCriteria
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
            linkedArtifacts: [],
            traceItems: [],
            activityItems: [{ author: requirementForm.owner || "Business Analyst", text: "Created initial requirement draft.", timestamp: "Now" }]
        });
        setSelectedId(createdRequirement.id);
        setRequirementForm(EMPTY_REQUIREMENT_FORM);
        setIsCreateOpen(false);
    }

    async function addReviewNote() {
        if (!activeRequirement) {
            return;
        }

        await onUpdateRequirement({
            id: activeRequirement.id,
            activityItems: [
                { author: "Project Lead", text: "Added a review note from the frontend dummy flow.", timestamp: "Now" },
                ...(activeRequirement.activityItems ?? [])
            ]
        });
    }

    async function createOrOpenUseCaseDiagram() {
        if (!activeRequirement) {
            return;
        }

        const existingDiagram = useCaseDiagrams.find((diagram) =>
            diagram.linkedRequirementIds.includes(activeRequirement.id)
        );

        if (existingDiagram) {
            await onEnsureUseCaseDiagramBinding(existingDiagram, activeRequirement);
            router.push(`/app/backends/${backend.slug}/usecase-diagrams/${existingDiagram.slug}`);
            return;
        }

        const diagram = await onCreateUseCaseDiagram(activeRequirement);
        router.push(`/app/backends/${backend.slug}/usecase-diagrams/${diagram.slug}`);
    }

    async function createOrOpenActivityDiagram() {
        if (!activeRequirement) {
            return;
        }

        const existingUseCase = useCaseDiagrams.find((diagram) =>
            diagram.linkedRequirementIds.includes(activeRequirement.id)
        );
        const useCaseDiagram = existingUseCase ?? await onCreateUseCaseDiagram(activeRequirement);
        const existingActivityDiagram = activityDiagrams.find(
            (diagram) =>
                diagram.linkedUseCaseSlug === useCaseDiagram.slug &&
                diagram.linkedRequirementIds.includes(activeRequirement.id)
        );

        if (existingActivityDiagram) {
            await onEnsureActivityDiagramBinding(existingActivityDiagram, activeRequirement, useCaseDiagram);
            router.push(`/app/backends/${backend.slug}/activity-diagram/${useCaseDiagram.slug}`);
            return;
        }

        await onCreateActivityDiagram(activeRequirement, useCaseDiagram);
        router.push(`/app/backends/${backend.slug}/activity-diagram/${useCaseDiagram.slug}`);
    }

    if (!hasOverview) {
        return (
            <section className="page-section backend-page">
                <div className="card backend-state-card">
                    <div className="card-body backend-blocked-state">
                        <span className="requirements-eyebrow">Overview Required</span>
                        <strong>Requirements are locked until the backend overview is created.</strong>
                        <p>Return to the backend overview page, define what the system should do, then come back here.</p>
                    </div>
                </div>
            </section>
        );
    }

    if (isLoading) {
        return (
            <section className="page-section requirements-page">
                <div className="requirements-toolbar-shell">
                    <div className="requirements-skeleton requirements-skeleton-title" />
                    <div className="requirements-skeleton requirements-skeleton-actions" />
                </div>
                <div className="requirements-grid">
                    <div className="card requirements-skeleton-panel" />
                    <div className="card requirements-skeleton-panel" />
                    <div className="card requirements-skeleton-panel" />
                </div>
            </section>
        );
    }

    return (
        <section className={`page-section requirements-page ${isCreateOpen ? "backend-page-blurred" : ""}`}>
            <div className="card requirements-toolbar-card">
                <div className="card-body requirements-toolbar-body">
                    <div className="requirements-title-block">
                        <span className="requirements-eyebrow">Backend Requirements</span>
                        <h1>{backend.name}</h1>
                        <p>Inspect and draft requirements within the selected backend context only.</p>
                    </div>

                    <div className="requirements-toolbar-controls">
                        <label className="requirements-search-field">
                            <input type="search" placeholder="Search requirement sections" value={query} onChange={(event) => setQuery(event.target.value)} />
                        </label>

                        <select className="requirements-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | "Draft" | "In Review" | "Approved")}>
                            <option value="All">All statuses</option>
                            <option value="Draft">Draft</option>
                            <option value="In Review">In Review</option>
                            <option value="Approved">Approved</option>
                        </select>

                        <button type="button" className="requirements-action-button" onClick={() => setIsCreateOpen(true)}>
                            New requirement
                        </button>
                    </div>
                </div>
            </div>

            {filteredRequirements.length === 0 ? (
                <div className="card requirements-state-card">
                    <div className="card-body requirements-state-body">
                        <strong>No requirement sections match the current filters.</strong>
                        <p>Try clearing the search query or add the first backend requirement.</p>
                        <div className="backend-inline-actions">
                            <button type="button" className="secondary-button" onClick={() => { setQuery(""); setStatusFilter("All"); }}>
                                Reset filters
                            </button>
                            <button type="button" className="requirements-action-button" onClick={() => setIsCreateOpen(true)}>
                                Create requirement
                            </button>
                        </div>
                    </div>
                </div>
            ) : !activeRequirement ? (
                <div className="card requirements-state-card">
                    <div className="card-body requirements-state-body">
                        <strong>The selected requirement is not available in the current view.</strong>
                        <p>Restore the active selection to continue the backend requirement review.</p>
                        <button type="button" className="requirements-action-button" onClick={() => setSelectedId(filteredRequirements[0]?.id ?? null)}>
                            Restore selection
                        </button>
                    </div>
                </div>
            ) : (
                <div className="requirements-grid">
                    <aside className="card requirements-rail-card">
                        <div className="card-header requirements-panel-header">
                            <div>
                                <span className="requirements-eyebrow">Sections</span>
                                <h3>Requirement Index</h3>
                            </div>
                            <span className="requirements-count-pill">{filteredRequirements.length}</span>
                        </div>
                        <div className="card-body requirements-rail-body">
                            <RequirementsSectionList
                                items={filteredRequirements.map((section) => ({
                                    id: section.id,
                                    code: section.code ?? "",
                                    title: section.title,
                                    category: section.category ?? "Core",
                                    owner: section.owner ?? "Business Analyst",
                                    status: section.status ?? "Draft",
                                    priority: section.priority ?? "High",
                                    updatedAt: section.updatedAt,
                                    excerpt: section.excerpt ?? section.summary
                                })) as RequirementSummary[]}
                                activeId={effectiveSelectedId}
                                onSelect={setSelectedId}
                            />
                        </div>
                    </aside>

                    <RequirementsDetailPanel
                        requirement={{
                            id: activeRequirement.id,
                            code: activeRequirement.code ?? "",
                            title: activeRequirement.title,
                            summary: activeRequirement.summary,
                            body: activeRequirement.content,
                            acceptanceCriteria: activeRequirement.acceptanceCriteria ?? [],
                            linkedArtifacts: activeRequirement.linkedArtifacts ?? [],
                            tags: activeRequirement.tags,
                            owner: activeRequirement.owner ?? "Business Analyst",
                            status: activeRequirement.status ?? "Draft",
                            updatedAt: activeRequirement.updatedAt
                        }}
                        canEdit={true}
                        hasUseCaseDiagram={useCaseDiagrams.some((diagram) => diagram.linkedRequirementIds.includes(activeRequirement.id))}
                        hasActivityDiagram={activityDiagrams.some((diagram) => diagram.linkedRequirementIds.includes(activeRequirement.id))}
                        onCreateUseCaseDiagram={() => { createOrOpenUseCaseDiagram().catch(() => {}); }}
                        onOpenUseCaseDiagram={() => { createOrOpenUseCaseDiagram().catch(() => {}); }}
                        onCreateActivityDiagram={() => { createOrOpenActivityDiagram().catch(() => {}); }}
                        onOpenActivityDiagram={() => { createOrOpenActivityDiagram().catch(() => {}); }}
                    />

                    <div className="requirements-side-stack">
                        <div className="card requirements-side-card">
                            <div className="card-header requirements-panel-header">
                                <div>
                                    <span className="requirements-eyebrow">Quick Actions</span>
                                    <h3>Review Flow</h3>
                                </div>
                            </div>
                            <div className="card-body backend-quick-actions">
                                <button type="button" className="requirements-action-button" onClick={() => setIsCreateOpen(true)}>
                                    New requirement
                                </button>
                                <button type="button" className="secondary-button" onClick={addReviewNote}>
                                    Add review note
                                </button>
                            </div>
                        </div>
                        <RequirementsTraceabilityPanel
                            traceItems={activeRequirement.traceItems ?? []}
                            activityItems={activeRequirement.activityItems ?? []}
                            canComment={true}
                        />
                    </div>
                </div>
            )}

            {isCreateOpen ? (
                <BackendModal title="Create backend requirement" description="Capture the requirement details for the selected backend specification." onClose={() => setIsCreateOpen(false)}>
                    <BackendRequirementFormFields value={requirementForm} onChange={setRequirementForm} />
                    <div className="backend-modal-actions">
                        <button type="button" className="secondary-button" onClick={() => setIsCreateOpen(false)}>
                            Cancel
                        </button>
                        <button type="button" className="requirements-action-button" onClick={saveRequirement}>
                            Save requirement
                        </button>
                    </div>
                </BackendModal>
            ) : null}
        </section>
    );
}
