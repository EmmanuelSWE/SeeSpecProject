"use client";

import { useEffect, useMemo, useState } from "react";
import type { IUserSession } from "@/app/lib/providers/userProvider/context";
import { RequirementsDetailPanel } from "@/app/components/app/requirements-detail-panel";
import {
  RequirementsSectionList,
  type RequirementSummary
} from "@/app/components/app/requirements-section-list";
import { RequirementsTraceabilityPanel } from "@/app/components/app/requirements-traceability-panel";

type RequirementRecord = RequirementSummary & {
  summary: string;
  body: string[];
  acceptanceCriteria: string[];
  linkedArtifacts: { label: string; href: string; kind: "Task" | "Diagram" | "Domain" }[];
  tags: string[];
  traceItems: { title: string; detail: string; kind: "Comment" | "Task" | "Dependency" }[];
  activityItems: { author: string; text: string; timestamp: string }[];
};

const REQUIREMENT_MOCKS: RequirementRecord[] = [
  {
    id: "req-tenant-scope",
    code: "REQ-01",
    title: "Tenant-scoped authentication and workspace isolation",
    category: "Core",
    owner: "Business Analyst",
    status: "Approved",
    priority: "High",
    updatedAt: "2h ago",
    excerpt: "Users must authenticate into the correct tenant scope and only see workspace data that belongs to it.",
    summary: "Authentication must resolve the correct tenant context before workspace pages, assignment lists, and generated artifacts become available.",
    body: [
      "The system must prevent tenant crossover in both navigation and API-backed content. Once a tenant is selected, the workspace should show only projects, diagrams, requirements, and users within that tenant boundary.",
      "Host administrators may enter a tenant for supervision, but within that tenant they should experience tenant-scoped content and controls rather than host-only management surfaces."
    ],
    acceptanceCriteria: [
      "Selecting a tenant results in a tenant-specific workspace shell and filtered project data.",
      "Users without tenant access cannot view requirements, assignments, or diagrams for that tenant.",
      "Host-only controls remain unavailable once the session is operating inside a tenant workspace."
    ],
    linkedArtifacts: [
      { label: "Auth session flow", href: "/app/usecase-diagrams", kind: "Diagram" },
      { label: "Tenant bootstrap", href: "/app/assignments", kind: "Task" },
      { label: "User scope rules", href: "/app/domain-model", kind: "Domain" }
    ],
    tags: ["Authentication", "Tenant scope", "Access control"],
    traceItems: [
      { kind: "Dependency", title: "Session cookie contract", detail: "Must match the BFF-backed auth flow." },
      { kind: "Task", title: "Tenant admin seed verification", detail: "Confirm each tenant gets an admin user with default credentials." },
      { kind: "Comment", title: "Host fallback behavior", detail: "Host admin should become tenant-admin scoped after entering a tenant." }
    ],
    activityItems: [
      { author: "Emmanuel", text: "Validated login handling for host and tenant scope transitions.", timestamp: "11:24" },
      { author: "Business Analyst", text: "Updated acceptance criteria to clarify host-to-tenant behavior.", timestamp: "09:12" }
    ]
  },
  {
    id: "req-spec-editing",
    code: "REQ-02",
    title: "Structured requirements editing with section ownership",
    category: "Specification",
    owner: "Project Lead",
    status: "In Review",
    priority: "High",
    updatedAt: "Today",
    excerpt: "Requirement sections must be editable with clear ownership boundaries between analysts, architects, and leads.",
    summary: "Requirement content should remain structured into sections and items so edits preserve machine-readable generation input.",
    body: [
      "Business analysts are expected to own requirement-oriented sections, while project leads may coordinate and edit across the full specification set. Systems architects should not be shown requirement-only editing surfaces unless granted broader project authority.",
      "The UI should make ownership visible at the section level and keep traceability to linked tasks, diagrams, and later generation snapshots."
    ],
    acceptanceCriteria: [
      "Each editable section shows its owner role and current approval state.",
      "Requirement items can be filtered and reviewed without losing structured section hierarchy.",
      "Linked diagrams and tasks remain reachable from the detail surface."
    ],
    linkedArtifacts: [
      { label: "Requirements canvas", href: "/app/requirements", kind: "Task" },
      { label: "Section ownership model", href: "/app/domain-model", kind: "Domain" },
      { label: "Use case traceability", href: "/app/usecase-diagrams", kind: "Diagram" }
    ],
    tags: ["Sections", "Ownership", "Traceability"],
    traceItems: [
      { kind: "Task", title: "Role-aware edit affordances", detail: "Hide requirement edit tools when the session is read-only." },
      { kind: "Dependency", title: "Section dependency map", detail: "Requirement edits affect downstream domain and activity screens." }
    ],
    activityItems: [
      { author: "Project Lead", text: "Requested inline links to related diagrams and assignments.", timestamp: "Yesterday" },
      { author: "Business Analyst", text: "Marked the editing model ready for stakeholder review.", timestamp: "Yesterday" }
    ]
  },
  {
    id: "req-generation-traceability",
    code: "REQ-03",
    title: "Generation snapshots must remain traceable to requirement changes",
    category: "Generation",
    owner: "System Architect",
    status: "Draft",
    priority: "Medium",
    updatedAt: "1d ago",
    excerpt: "Every generation event should reference the requirement context that produced it and the person responsible.",
    summary: "SeeSpec should make generation history reviewable without losing the requirement state that informed it.",
    body: [
      "A generation snapshot should record who triggered it, which requirement sections were involved, and what outcome or validation result was produced. Completion notes should summarize the generated impact in plain language.",
      "Reviewing a requirement should immediately reveal whether recent generation runs are still aligned with the current version of that requirement."
    ],
    acceptanceCriteria: [
      "Requirement detail view displays recent linked generation history or validation dependencies.",
      "Users can identify who triggered a generation snapshot from the requirement context.",
      "Completion notes summarize the effect of generation on the requirement."
    ],
    linkedArtifacts: [
      { label: "Snapshot history", href: "/app/settings", kind: "Task" },
      { label: "Activity sequence", href: "/app/activity-diagram", kind: "Diagram" }
    ],
    tags: ["Generation", "Snapshots", "Audit"],
    traceItems: [
      { kind: "Comment", title: "Validation alignment", detail: "Draft until validation payload shape is finalized." },
      { kind: "Dependency", title: "Snapshot domain entity", detail: "Depends on generation and validation record models." }
    ],
    activityItems: [
      { author: "System Architect", text: "Awaiting validation payload contract before final approval.", timestamp: "1d ago" }
    ]
  }
];

export function RequirementsWorkspace({ session }: { session: IUserSession | null }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | RequirementRecord["status"]>("All");
  const [selectedId, setSelectedId] = useState<string | null>(REQUIREMENT_MOCKS[0]?.id ?? null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 180);
    return () => window.clearTimeout(timer);
  }, []);

  const canEdit = useMemo(() => {
    const roles = session?.roleNames ?? [];
    return roles.includes("Project Lead") || roles.includes("Business Analyst") || roles.includes("Tenant Admin");
  }, [session]);

  const filteredRequirements = useMemo(() => {
    return REQUIREMENT_MOCKS.filter((item) => {
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.code.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));

      const matchesStatus = statusFilter === "All" || item.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  const activeRequirement = filteredRequirements.find((item) => item.id === selectedId) ?? null;

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
    <section className="page-section requirements-page">
      <div className="card requirements-toolbar-card">
        <div className="card-body requirements-toolbar-body">
          <div className="requirements-title-block">
            <span className="requirements-eyebrow">Specification Workspace</span>
            <h1>Requirements</h1>
            <p>Review structured requirement sections, linked diagrams, and team traceability before generation.</p>
          </div>

          <div className="requirements-toolbar-controls">
            <label className="requirements-search-field">
              <input
                type="search"
                placeholder="Search requirement sections"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <select
              className="requirements-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "All" | RequirementRecord["status"])}
            >
              <option value="All">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="In Review">In Review</option>
              <option value="Approved">Approved</option>
            </select>

            <button type="button" className="requirements-action-button" disabled={!canEdit}>
              {canEdit ? "New requirement" : "Read only"}
            </button>
          </div>
        </div>
      </div>

      {filteredRequirements.length === 0 ? (
        <div className="card requirements-state-card">
          <div className="card-body requirements-state-body">
            <strong>No requirement sections match the current filters.</strong>
            <p>Try clearing the search query or changing the status filter.</p>
            <button
              type="button"
              className="requirements-action-button"
              onClick={() => {
                setQuery("");
                setStatusFilter("All");
                setSelectedId(REQUIREMENT_MOCKS[0]?.id ?? null);
              }}
            >
              Reset filters
            </button>
          </div>
        </div>
      ) : !activeRequirement ? (
        <div className="card requirements-state-card">
          <div className="card-body requirements-state-body">
            <strong>The selected requirement is no longer available in the current view.</strong>
            <p>Reset the active selection to continue reviewing structured requirement content.</p>
            <button
              type="button"
              className="requirements-action-button"
              onClick={() => setSelectedId(filteredRequirements[0]?.id ?? null)}
            >
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
              <RequirementsSectionList items={filteredRequirements} activeId={selectedId} onSelect={setSelectedId} />
            </div>
          </aside>

          <RequirementsDetailPanel requirement={activeRequirement} canEdit={canEdit} />

          <RequirementsTraceabilityPanel
            traceItems={activeRequirement.traceItems}
            activityItems={activeRequirement.activityItems}
            canComment={canEdit}
          />
        </div>
      )}
    </section>
  );
}
