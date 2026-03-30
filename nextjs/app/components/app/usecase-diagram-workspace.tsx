"use client";

import Link from "next/link";
import type { BackendRecord, BackendUseCaseRecord } from "@/app/lib/mock-backends";

function resolveRequirementLinks(backend: BackendRecord, linkedRequirementIds: string[]) {
    return backend.requirements.filter((requirement) => linkedRequirementIds.includes(requirement.id));
}

export function UseCaseDiagramWorkspace({
    backend,
    useCase
}: {
    backend: BackendRecord;
    useCase: BackendUseCaseRecord;
}) {
    const linkedRequirements = resolveRequirementLinks(backend, useCase.linkedRequirementIds);

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
                            <div className="badge-row">
                                {useCase.actors.map((actor) => (
                                    <span key={actor} className="badge">
                                        {actor}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="usecase-summary-block">
                            <strong>Dependencies</strong>
                            {useCase.dependencies.length > 0 ? (
                                <div className="usecase-link-list">
                                    {useCase.dependencies.map((dependency) => (
                                        <Link
                                            key={dependency.slug}
                                            href={`/app/backends/${backend.slug}/usecase-diagrams/${dependency.slug}`}
                                            className="requirements-link-card"
                                        >
                                            <span>Dependency</span>
                                            <strong>{dependency.name}</strong>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p>No downstream use case dependencies are linked yet.</p>
                            )}
                        </div>
                    </div>
                </aside>

                <article className="card usecase-scene-card">
                    <div className="card-header usecase-panel-header">
                        <div>
                            <span className="requirements-eyebrow">Diagram Scene</span>
                            <h3>Draw.io editor surface</h3>
                        </div>
                    </div>
                    <div className="card-body usecase-scene-body">
                        <div className="usecase-scene-frame">
                            <div className="usecase-scene-grid" />
                            <div className="usecase-scene-overlay">
                                <strong>{useCase.name}</strong>
                                <p>This center scene is reserved for the draw.io API editor integration.</p>
                            </div>
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
