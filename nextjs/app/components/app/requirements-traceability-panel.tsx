"use client";

type TraceItem = {
  title: string;
  detail: string;
  kind: "Comment" | "Task" | "Dependency";
};

type ActivityItem = {
  author: string;
  text: string;
  timestamp: string;
};

export function RequirementsTraceabilityPanel({
  traceItems,
  activityItems,
  canComment
}: {
  traceItems: TraceItem[];
  activityItems: ActivityItem[];
  canComment: boolean;
}) {
  return (
    <div className="requirements-side-stack">
      <article className="card requirements-side-card">
        <div className="card-header requirements-panel-header">
          <div>
            <span className="requirements-eyebrow">Traceability</span>
            <h3>Connected Work</h3>
          </div>
        </div>
        <div className="card-body requirements-trace-list">
          {traceItems.map((item) => (
            <div key={`${item.kind}-${item.title}`} className="requirements-trace-item">
              <span>{item.kind}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="card requirements-side-card">
        <div className="card-header requirements-panel-header">
          <div>
            <span className="requirements-eyebrow">Comments</span>
            <h3>Latest Discussion</h3>
          </div>
          <button type="button" className="requirements-action-button" disabled={!canComment}>
            {canComment ? "Add note" : "Locked"}
          </button>
        </div>
        <div className="card-body requirements-activity-list">
          {activityItems.map((item) => (
            <div key={`${item.author}-${item.timestamp}`} className="requirements-activity-item">
              <strong>{item.author}</strong>
              <p>{item.text}</p>
              <span>{item.timestamp}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
