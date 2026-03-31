"use client";

import Link from "next/link";
import { SemanticSvgDiagramEditor } from "@/app/components/app/semantic-svg-diagram-editor";
import type { BackendDto } from "@/app/lib/utils/services/backend-service";
import type { DiagramElementDto } from "@/app/lib/utils/services/diagram-element-service";

export function DomainModelWorkspace({
    backend,
    diagram,
    onCreateDiagram
}: {
    backend: BackendDto;
    diagram: DiagramElementDto | null;
    onCreateDiagram: () => Promise<void>;
}) {
    const entities = diagram?.entities ?? [];
    const relationships = diagram?.relationships ?? [];

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

            <div className="usecase-layout">
                <aside className="card usecase-summary-card">
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
                                {entities.map((entity) => (
                                    <div key={entity.id} className="requirements-link-card">
                                        <span>Entity</span>
                                        <strong>{entity.name}</strong>
                                        <p>{entity.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="usecase-summary-block">
                            <strong>Relationships</strong>
                            <div className="usecase-link-list">
                                {relationships.map((relationship) => (
                                    <div key={relationship.id} className="requirements-link-card">
                                        <span>Relationship</span>
                                        <strong>
                                            {relationship.source} {relationship.label} {relationship.target}
                                        </strong>
                                    </div>
                                ))}
                            </div>
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
                            {diagram ? (
                                <SemanticSvgDiagramEditor
                                    diagramElementId={diagram.id}
                                    title={`${backend.name} domain model`}
                                    defaultNodeType="entity"
                                    allowMembers
                                />
                            ) : (
                                <div className="semantic-diagram-empty">
                                    <strong>No domain model diagram is defined yet.</strong>
                                    <p>Create a backend-scoped domain diagram element before editing the semantic graph.</p>
                                    <button type="button" className="requirements-action-button" onClick={() => { onCreateDiagram().catch(() => {}); }}>
                                        Create domain model
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </article>

                <aside className="card usecase-linked-card">
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
        </section>
    );
}
