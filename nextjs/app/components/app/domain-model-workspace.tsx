"use client";

import Link from "next/link";
import { SemanticSvgDiagramEditor } from "@/app/components/app/semantic-svg-diagram-editor";
import { useDiagramElementState } from "@/app/lib/providers/diagramElementProvider";
import type { BackendRecord } from "@/app/lib/providers/backendProvider/context";
import type { DiagramElementDto } from "@/app/lib/utils/services/diagram-element-service";

export function DomainModelWorkspace({
    backend,
    diagram,
    canEditDiagram
}: {
    backend: BackendRecord;
    diagram: DiagramElementDto | null;
    canEditDiagram: boolean;
}) {
    const { graph } = useDiagramElementState();
    const activeGraph = graph?.diagramElementId === diagram?.id ? graph : null;
    const entities = activeGraph
        ? activeGraph.nodes.map((node) => ({
            id: node.id,
            name: node.label,
            description: node.description,
            attributes: node.members.map((member) => member.signature)
        }))
        : (diagram?.entities ?? []);
    const relationships = activeGraph
        ? activeGraph.edges.map((edge) => ({
            id: edge.id,
            source: activeGraph.nodes.find((node) => node.id === edge.sourceNodeId)?.label ?? edge.sourceNodeId,
            target: activeGraph.nodes.find((node) => node.id === edge.targetNodeId)?.label ?? edge.targetNodeId,
            label: edge.label || edge.edgeType
        }))
        : (diagram?.relationships ?? []);

    return (
        <section className="page-section usecase-page">
            <div className="card usecase-hero-card">
                <div className="card-body usecase-hero-body">
                    <div className="usecase-hero-copy">
                        <span className="requirements-eyebrow">Domain Model</span>
                        <h1>{backend.name}</h1>
                        <p>{diagram?.description || "Review the backend entities and their relationships before wiring the draw.io model scene."}</p>
                    </div>
                    <div className="usecase-hero-meta">
                        <span className="badge">{entities.length} entities</span>
                        <span className="badge">{relationships.length} relationships</span>
                    </div>
                </div>
            </div>

            <div className="domain-model-workspace-grid">
                <article className="card usecase-scene-card domain-model-scene-card">
                    <div className="card-header usecase-panel-header">
                        <div>
                            <span className="requirements-eyebrow">Diagram Scene</span>
                            <h3>Semantic SVG editor</h3>
                        </div>
                    </div>
                    <div className="card-body usecase-scene-body domain-model-scene-body">
                        <div className="usecase-scene-frame domain-model-scene-frame">
                            {diagram ? (
                                <SemanticSvgDiagramEditor
                                    diagramElementId={diagram.id}
                                    title={`${backend.name} domain model`}
                                    defaultNodeType="entity"
                                    allowMembers
                                    canEdit={canEditDiagram}
                                />
                            ) : (
                                <div className="semantic-diagram-empty">
                                    <strong>No domain model diagram is defined yet.</strong>
                                    <p>Create a backend-scoped domain diagram element before editing the semantic graph.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </article>
                <div className="domain-model-footer-row">
                    <div className="card domain-model-summary-card">
                        <div className="card-header usecase-panel-header">
                            <div>
                                <span className="requirements-eyebrow">Summary</span>
                                <h3>Entities and relationships</h3>
                            </div>
                        </div>
                        <div className="card-body usecase-summary-body">
                            <div className="usecase-summary-block">
                                <strong>Entities</strong>
                                <div className="usecase-link-list">
                                    {entities.length ? (
                                        entities.map((entity) => (
                                            <div key={entity.id} className="requirements-link-card">
                                                <span>Entity</span>
                                                <strong>{entity.name}</strong>
                                                <p>{entity.description}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="requirements-link-card">
                                            <span>Entity</span>
                                            <strong>No entities yet</strong>
                                            <p>Create your first entity from the left editor panel.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="usecase-summary-block">
                                <strong>Relationships</strong>
                                <div className="usecase-link-list">
                                    {relationships.length ? (
                                        relationships.map((relationship) => (
                                            <div key={relationship.id} className="requirements-link-card">
                                                <span>Relationship</span>
                                                <strong>
                                                    {relationship.source} {relationship.label} {relationship.target}
                                                </strong>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="requirements-link-card">
                                            <span>Relationship</span>
                                            <strong>No relationships yet</strong>
                                            <p>Add explicit relationship types after your entities are in place.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="card usecase-linked-card domain-model-linked-card">
                        <div className="card-header usecase-panel-header">
                            <div>
                                <span className="requirements-eyebrow">Linked Context</span>
                                <h3>Backend context</h3>
                            </div>
                        </div>
                        <div className="card-body usecase-linked-body">
                            <div className="usecase-summary-block">
                                <strong>Overview and requirements</strong>
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
            </div>
        </section>
    );
}
