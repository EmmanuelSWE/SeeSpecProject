"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SemanticSvgDiagramEditor } from "@/app/components/app/semantic-svg-diagram-editor";
import { useDiagramElementActions } from "@/app/lib/providers/diagramElementProvider";
import type { BackendRecord } from "@/app/lib/providers/backendProvider/context";
import type { DiagramElementDto } from "@/app/lib/utils/services/diagram-element-service";
import type { SpecSectionDto } from "@/app/lib/utils/services/spec-section-service";

export function UseCaseDiagramWorkspace({
    backend,
    useCase,
    linkedRequirements,
    useCaseNodes
}: {
    backend: BackendRecord;
    useCase: DiagramElementDto;
    linkedRequirements: SpecSectionDto[];
    useCaseNodes: Array<{ id: string; label: string }>;
}) {
    const router = useRouter();
    const { createDiagramElement, getDiagramElementsByBackend } = useDiagramElementActions();
    const [activityNavigationNodeId, setActivityNavigationNodeId] = useState<string | null>(null);

    const handleOpenActivityDiagram = async (node: { id: string; label: string }) => {
        try {
            setActivityNavigationNodeId(node.id);

            const existingDiagrams = await getDiagramElementsByBackend(backend.id);
            const existingActivity = existingDiagrams.find(
                (item) =>
                    item.backendId === backend.id &&
                    item.type === "activity" &&
                    item.linkedUseCaseSlug === useCase.slug &&
                    item.linkedUseCaseNodeId === node.id
            );

            if (!existingActivity) {
                await createDiagramElement({
                    backendId: backend.id,
                    specSectionId: useCase.specSectionId,
                    type: "activity",
                    slug: `activity-${useCase.slug}-${node.id}`.toLowerCase(),
                    name: `${node.label} Activity`,
                    summary: node.label,
                    description: `${node.label} activity flow`,
                    linkedRequirementIds: useCase.linkedRequirementIds,
                    linkedUseCaseSlug: useCase.slug,
                    linkedUseCaseNodeId: node.id,
                    linkedUseCaseNodeLabel: node.label
                });
            }

            router.push(`/app/backends/${backend.slug}/activity-diagram/${useCase.slug}/${node.id}`);
        } finally {
            setActivityNavigationNodeId(null);
        }
    };

    return (
        <section className="page-section usecase-page">
            <div className="card usecase-hero-card">
                <div className="card-body usecase-hero-body">
                    <div className="usecase-hero-copy">
                        <span className="requirements-eyebrow">Use Case Diagram</span>
                        <h1>{useCase.name}</h1>
                        <p>{useCase.description}</p>
                    </div>
                    <div className="usecase-hero-meta">
                        <span className="badge">{backend.name}</span>
                        <span className="badge">Updated {useCase.updatedAt}</span>
                    </div>
                </div>
            </div>

            <div className="usecase-layout">
                <aside className="card usecase-summary-card">
                    <div className="card-header usecase-panel-header">
                        <div>
                            <span className="requirements-eyebrow">Summary</span>
                            <h3>What is happening</h3>
                        </div>
                    </div>
                    <div className="card-body usecase-summary-body">
                        <div className="usecase-summary-block">
                            <strong>Use case</strong>
                            <p>{useCase.summary}</p>
                        </div>
                        <div className="usecase-summary-block">
                            <strong>Actors</strong>
                            {useCase.actors.length > 0 ? (
                                <div className="badge-row">
                                    {useCase.actors.map((actor) => (
                                        <span key={actor} className="badge">
                                            {actor}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p>No actors have been mapped to this use case yet.</p>
                            )}
                        </div>
                    </div>
                </aside>

                <article className="card usecase-scene-card">
                    <div className="card-header usecase-panel-header">
                        <div>
                            <span className="requirements-eyebrow">Diagram Scene</span>
                            <h3>Semantic SVG editor</h3>
                        </div>
                    </div>
                    <div className="card-body usecase-scene-body">
                        <div className="usecase-scene-frame">
                            <SemanticSvgDiagramEditor
                                diagramElementId={useCase.id}
                                title={`${useCase.name} use case diagram`}
                                defaultNodeType="use-case"
                                allowMembers={false}
                            />
                        </div>
                    </div>
                </article>

                <aside className="card usecase-linked-card">
                    <div className="card-header usecase-panel-header">
                        <div>
                            <span className="requirements-eyebrow">Linked Context</span>
                            <h3>Requirements and next steps</h3>
                        </div>
                    </div>
                    <div className="card-body usecase-linked-body">
                        <div className="usecase-summary-block">
                            <strong>Linked requirements</strong>
                            <div className="usecase-link-list">
                                {linkedRequirements.length > 0 ? (
                                    linkedRequirements.map((requirement) => (
                                        <Link
                                            key={requirement.id}
                                            href={`/app/backends/${backend.slug}/requirements`}
                                            className="requirements-link-card"
                                        >
                                            <span>{requirement.code}</span>
                                            <strong>{requirement.title}</strong>
                                        </Link>
                                    ))
                                ) : (
                                    <p>No requirements linked yet.</p>
                                )}
                            </div>
                        </div>
                        <div className="usecase-summary-block">
                            <strong>Stored use cases</strong>
                            <div className="usecase-link-list">
                                {useCaseNodes.length > 0 ? (
                                    useCaseNodes.map((node) => (
                                        <button
                                            key={node.id}
                                            type="button"
                                            className="requirements-link-card requirements-link-button"
                                            onClick={() => void handleOpenActivityDiagram(node)}
                                            disabled={activityNavigationNodeId === node.id}
                                        >
                                            <span>Use case</span>
                                            <strong>{node.label}</strong>
                                            <p>
                                                {activityNavigationNodeId === node.id
                                                    ? "Preparing activity diagram..."
                                                    : "Open its activity diagram"}
                                            </p>
                                        </button>
                                    ))
                                ) : (
                                    <p>Save at least one stored use case in the diagram to unlock its activity diagram.</p>
                                )}
                            </div>
                        </div>
                        <div className="usecase-summary-block">
                            <strong>Related backend pages</strong>
                            <div className="usecase-link-list">
                                <Link href={`/app/backends/${backend.slug}/overview`} className="requirements-link-card">
                                    <span>Backend</span>
                                    <strong>Overview</strong>
                                </Link>
                                <Link href={`/app/backends/${backend.slug}/requirements`} className="requirements-link-card">
                                    <span>Backend</span>
                                    <strong>Requirements</strong>
                                </Link>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </section>
    );
}
