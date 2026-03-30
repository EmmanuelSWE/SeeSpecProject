"use client";

import Link from "next/link";
import { DrawIoEditor } from "@/app/components/app/draw-io-editor";
import type { BackendRecord } from "@/app/lib/mock-backends";

export function DomainModelWorkspace({ backend }: { backend: BackendRecord }) {
    return (
        <section className="page-section usecase-page">
            <div className="card usecase-hero-card">
                <div className="card-body usecase-hero-body">
                    <div className="usecase-hero-copy">
                        <span className="requirements-eyebrow">Domain Model</span>
                        <h1>{backend.name}</h1>
                        <p>Review the backend entities and their relationships before wiring the draw.io model scene.</p>
                    </div>
                    <div className="usecase-hero-meta">
                        <span className="badge">{backend.domainEntities.length} entities</span>
                        <span className="badge">{backend.domainRelationships.length} relationships</span>
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
                                {backend.domainEntities.map((entity) => (
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
                                {backend.domainRelationships.map((relationship) => (
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
                            <h3>Draw.io model editor surface</h3>
                        </div>
                    </div>
                    <div className="card-body usecase-scene-body">
                        <div className="usecase-scene-frame">
                            <DrawIoEditor title={`${backend.name} domain model draw.io editor`} />
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
