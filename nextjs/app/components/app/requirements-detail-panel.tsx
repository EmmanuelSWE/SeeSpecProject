"use client";

type RequirementDetail = {
  id: string;
  code: string;
  title: string;
  summary: string;
  body: string[];
  acceptanceCriteria: string[];
  linkedArtifacts: { label: string; href: string; kind: "Task" | "Diagram" | "Domain" }[];
  tags: string[];
  owner: string;
  status: "Draft" | "In Review" | "Approved";
  updatedAt: string;
};

export function RequirementsDetailPanel({
  requirement,
  canEdit,
  onCreateUseCaseDiagram,
  onOpenUseCaseDiagram,
  onCreateActivityDiagram,
  onOpenActivityDiagram,
  hasUseCaseDiagram,
  hasActivityDiagram,
  isUseCaseBusy,
  isActivityBusy,
  canManageActivityFromRequirement
}: {
  requirement: RequirementDetail;
  canEdit: boolean;
  onCreateUseCaseDiagram: () => void;
  onOpenUseCaseDiagram: () => void;
  onCreateActivityDiagram: () => void;
  onOpenActivityDiagram: () => void;
  hasUseCaseDiagram: boolean;
  hasActivityDiagram: boolean;
  isUseCaseBusy: boolean;
  isActivityBusy: boolean;
  canManageActivityFromRequirement: boolean;
}) {
  return (
    <article className="card requirements-detail-panel">
      <div className="card-header requirements-panel-header">
        <div>
          <span className="requirements-eyebrow">{requirement.code}</span>
          <h3>{requirement.title}</h3>
        </div>
        <div className="requirements-header-actions">
          <span className={`requirements-status requirements-status-${requirement.status.toLowerCase().replace(/\s+/g, "-")}`}>
            {requirement.status}
          </span>
          <button type="button" className="requirements-action-button" disabled={!canEdit}>
            {canEdit ? "Edit section" : "Read only"}
          </button>
        </div>
      </div>
      <div className="card-body requirements-detail-body">
        <div className="requirements-detail-summary">
          <p>{requirement.summary}</p>
          <div className="badge-row">
            {requirement.tags.map((tag) => (
              <span key={tag} className="badge">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="requirements-copy-block">
          {requirement.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="requirements-subsection">
          <h4>Acceptance Criteria</h4>
          <ul>
            {requirement.acceptanceCriteria.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ul>
        </div>

        <div className="requirements-subsection">
          <h4>Requirement Diagrams</h4>
          <div className="requirements-link-grid">
            <button
              type="button"
              className="requirements-link-card requirements-link-button"
              onClick={hasUseCaseDiagram ? onOpenUseCaseDiagram : onCreateUseCaseDiagram}
              disabled={isUseCaseBusy}
            >
              <span>Diagram</span>
              <strong>
                {isUseCaseBusy
                  ? "Opening use case diagram..."
                  : hasUseCaseDiagram
                    ? "Open use case diagram"
                    : "Create use case diagram"}
              </strong>
            </button>
            <button
              type="button"
              className="requirements-link-card requirements-link-button"
              onClick={hasActivityDiagram ? onOpenActivityDiagram : onCreateActivityDiagram}
              disabled={isActivityBusy || !canManageActivityFromRequirement}
            >
              <span>Diagram</span>
              <strong>
                {!canManageActivityFromRequirement
                  ? "Manage from use case diagram"
                  : isActivityBusy
                  ? "Opening activity diagram..."
                  : hasActivityDiagram
                    ? "Open activity diagram"
                    : "Create activity diagram"}
              </strong>
            </button>
          </div>
        </div>

        <div className="requirements-subsection">
          <h4>Linked Artifacts</h4>
          <div className="requirements-link-grid">
            {requirement.linkedArtifacts.map((artifact) => (
              <a key={`${artifact.kind}-${artifact.label}`} href={artifact.href} className="requirements-link-card">
                <span>{artifact.kind}</span>
                <strong>{artifact.label}</strong>
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="card-footer requirements-panel-footer">
        <span>Owned by {requirement.owner}</span>
        <span>Updated {requirement.updatedAt}</span>
      </div>
    </article>
  );
}
