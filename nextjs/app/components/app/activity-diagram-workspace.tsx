"use client";

import Link from "next/link";
import { SemanticSvgDiagramEditor } from "@/app/components/app/semantic-svg-diagram-editor";
import type { BackendRecord } from "@/app/lib/providers/backendProvider/context";
import type { DiagramElementDto } from "@/app/lib/utils/services/diagram-element-service";

export function ActivityDiagramWorkspace({
  backend,
  useCase,
  activityDiagram,
  canEditDiagram
}: {
  backend: BackendRecord;
  useCase: DiagramElementDto;
  activityDiagram: DiagramElementDto;
  canEditDiagram: boolean;
}) {
  const activityTitle = activityDiagram.linkedUseCaseNodeLabel ?? useCase.name;

  return (
    <section className="page-section usecase-page">
      <div className="card usecase-hero-card">
        <div className="card-body usecase-hero-body">
          <div className="usecase-hero-copy">
            <span className="requirements-eyebrow">Activity Diagram</span>
            <h1>{activityTitle}</h1>
            <p>{activityDiagram.summary || useCase.description}</p>
          </div>
          <div className="usecase-hero-meta">
            <span className="badge">{backend.name}</span>
            <span className="badge">Linked use case</span>
          </div>
        </div>
      </div>

      <div className="usecase-layout">
        <aside className="card usecase-summary-card">
          <div className="card-header usecase-panel-header">
            <div>
              <span className="requirements-eyebrow">Summary</span>
              <h3>Use case flow</h3>
            </div>
          </div>
          <div className="card-body usecase-summary-body">
            <div className="usecase-summary-block">
              <strong>Description</strong>
              <p>{activityDiagram.description || useCase.description}</p>
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
                diagramElementId={activityDiagram.id}
                title={`${activityTitle} activity diagram`}
                defaultNodeType="action"
                allowMembers={false}
                canEdit={canEditDiagram}
              />
            </div>
          </div>
        </article>

        <aside className="card usecase-linked-card">
          <div className="card-header usecase-panel-header">
            <div>
              <span className="requirements-eyebrow">Linked Context</span>
              <h3>Related pages</h3>
            </div>
          </div>
          <div className="card-body usecase-linked-body">
            <div className="usecase-summary-block">
              <strong>Back to context</strong>
              <div className="usecase-link-list">
                <Link href={`/app/backends/${backend.slug}/usecase-diagrams/${useCase.slug}`} className="requirements-link-card">
                  <span>Use case</span>
                  <strong>Use case diagram</strong>
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
