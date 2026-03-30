"use client";

export type RequirementSummary = {
  id: string;
  code: string;
  title: string;
  category: string;
  owner: string;
  status: "Draft" | "In Review" | "Approved";
  priority: "High" | "Medium" | "Low";
  updatedAt: string;
  excerpt: string;
};

export function RequirementsSectionList({
  items,
  activeId,
  onSelect
}: {
  items: RequirementSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="requirements-rail-list">
      {items.map((item) => {
        const isActive = item.id === activeId;

        return (
          <button
            key={item.id}
            type="button"
            className={`requirements-rail-item ${isActive ? "active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <div className="requirements-rail-item-header">
              <div>
                <strong>{item.code}</strong>
                <p>{item.title}</p>
              </div>
              <span className={`requirements-priority requirements-priority-${item.priority.toLowerCase()}`}>
                {item.priority}
              </span>
            </div>
            <p className="requirements-rail-excerpt">{item.excerpt}</p>
            <div className="requirements-rail-meta">
              <span>{item.category}</span>
              <span>{item.owner}</span>
            </div>
            <div className="requirements-rail-footer">
              <span className={`requirements-status requirements-status-${item.status.toLowerCase().replace(/\s+/g, "-")}`}>
                {item.status}
              </span>
              <span>{item.updatedAt}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
