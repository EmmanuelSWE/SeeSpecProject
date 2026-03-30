"use client";

export type BackendRoleName = "Tenant Admin" | "Project Lead" | "Business Analyst" | "System Architect";
export type RequirementStatus = "Draft" | "In Review" | "Approved";

export interface BackendOverviewRecord {
    summary: string;
    scope: string;
    goals: string;
}

export interface BackendRoleRecord {
    id: string;
    roleName: BackendRoleName;
    assignedTo: string;
    emailAddress: string;
    note: string;
}

export interface BackendRequirementRecord {
    id: string;
    code: string;
    title: string;
    category: string;
    owner: string;
    status: RequirementStatus;
    priority: "High" | "Medium" | "Low";
    updatedAt: string;
    excerpt: string;
    summary: string;
    body: string[];
    acceptanceCriteria: string[];
    linkedArtifacts: { label: string; href: string; kind: "Task" | "Diagram" | "Domain" }[];
    tags: string[];
    traceItems: { title: string; detail: string; kind: "Comment" | "Task" | "Dependency" }[];
    activityItems: { author: string; text: string; timestamp: string }[];
}

export interface BackendRecord {
    id: string;
    slug: string;
    name: string;
    framework: string;
    runtimeVersion: string;
    status: "Active" | "Planned" | "Maintenance";
    repositoryUrl: string;
    updatedAt: string;
    description: string;
    overview: BackendOverviewRecord | null;
    roles: BackendRoleRecord[];
    requirements: BackendRequirementRecord[];
}

const STORAGE_KEY = "seespec.mockBackends";

const DEFAULT_BACKENDS: BackendRecord[] = [
    {
        id: "backend-001",
        slug: "payments-core",
        name: "Payments Core",
        framework: "ABP Application",
        runtimeVersion: ".NET 8",
        status: "Active",
        repositoryUrl: "https://git.example.local/payments-core",
        updatedAt: "Today",
        description: "Tenant payment orchestration, billing approvals, and outbound invoice lifecycle.",
        overview: {
            summary:
                "Payments Core manages billing approvals, settlement orchestration, and financial event traceability across tenant workspaces.",
            scope:
                "The backend covers payment initiation, approval routing, settlement callbacks, invoicing hooks, and generation-facing audit records.",
            goals:
                "Keep billing flows isolated per tenant, preserve requirement traceability, and support downstream generation and validation workflows."
        },
        roles: [
            {
                id: "role-001",
                roleName: "Tenant Admin",
                assignedTo: "Admin Default",
                emailAddress: "admin@payments.local",
                note: "Owns tenant-wide configuration and access."
            },
            {
                id: "role-002",
                roleName: "Business Analyst",
                assignedTo: "Ava Morgan",
                emailAddress: "ava@payments.local",
                note: "Owns requirement discovery and validation criteria."
            }
        ],
        requirements: [
            {
                id: "req-001",
                code: "REQ-01",
                title: "Tenant-scoped payment approval",
                category: "Core",
                owner: "Business Analyst",
                status: "Approved",
                priority: "High",
                updatedAt: "2h ago",
                excerpt: "Payment approvals must remain isolated to the current tenant and role assignment chain.",
                summary: "Payment approval must enforce tenant scope before any invoice or settlement action is exposed.",
                body: [
                    "The system should show only approvals that belong to the selected backend and tenant workspace.",
                    "Host users entering this backend inside a tenant should see the same tenant-admin experience and not host-only controls."
                ],
                acceptanceCriteria: [
                    "Approvers only see payment requests for the active tenant backend.",
                    "Approval actions are audited with the acting role and timestamp.",
                    "Traceability links from requirements to diagrams remain visible."
                ],
                linkedArtifacts: [
                    { label: "Approval assignment", href: "/app/assignments", kind: "Task" },
                    { label: "Payment use cases", href: "/app/usecase-diagrams", kind: "Diagram" }
                ],
                tags: ["Payments", "Approvals", "Tenant scope"],
                traceItems: [
                    { kind: "Task", title: "Assignment alignment", detail: "Approval routing must mirror assignment ownership." },
                    { kind: "Dependency", title: "Diagram sync", detail: "Use case diagram must stay in sync with payment actors." }
                ],
                activityItems: [
                    { author: "Ava Morgan", text: "Confirmed approval boundary with tenant admins.", timestamp: "11:24" }
                ]
            }
        ]
    },
    {
        id: "backend-002",
        slug: "identity-hub",
        name: "Identity Hub",
        framework: "ABP Application",
        runtimeVersion: ".NET 8",
        status: "Planned",
        repositoryUrl: "https://git.example.local/identity-hub",
        updatedAt: "Yesterday",
        description: "Identity and tenant membership orchestration for cross-project onboarding.",
        overview: null,
        roles: [],
        requirements: []
    }
];

function canUseStorage() {
    return typeof window !== "undefined";
}

function cloneDefaultBackends() {
    return DEFAULT_BACKENDS.map((backend) => ({
        ...backend,
        overview: backend.overview ? { ...backend.overview } : null,
        roles: backend.roles.map((role) => ({ ...role })),
        requirements: backend.requirements.map((requirement) => ({
            ...requirement,
            body: [...requirement.body],
            acceptanceCriteria: [...requirement.acceptanceCriteria],
            linkedArtifacts: requirement.linkedArtifacts.map((artifact) => ({ ...artifact })),
            tags: [...requirement.tags],
            traceItems: requirement.traceItems.map((item) => ({ ...item })),
            activityItems: requirement.activityItems.map((item) => ({ ...item }))
        }))
    }));
}

export function slugifyBackendName(name: string) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function readBackendRecords(): BackendRecord[] {
    if (!canUseStorage()) {
        return cloneDefaultBackends();
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        const defaults = cloneDefaultBackends();
        writeBackendRecords(defaults);
        return defaults;
    }

    try {
        return JSON.parse(raw) as BackendRecord[];
    } catch {
        const defaults = cloneDefaultBackends();
        writeBackendRecords(defaults);
        return defaults;
    }
}

export function writeBackendRecords(backends: BackendRecord[]) {
    if (!canUseStorage()) {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(backends));
}

export function findBackendBySlug(slug: string): BackendRecord | null {
    return readBackendRecords().find((backend) => backend.slug === slug) ?? null;
}

export function createBackendRecord(input: {
    name: string;
    framework: string;
    runtimeVersion: string;
    repositoryUrl: string;
    description: string;
    status: BackendRecord["status"];
}): BackendRecord {
    return {
        id: `backend-${Date.now()}`,
        slug: slugifyBackendName(input.name),
        name: input.name,
        framework: input.framework,
        runtimeVersion: input.runtimeVersion,
        status: input.status,
        repositoryUrl: input.repositoryUrl,
        description: input.description,
        updatedAt: "Just now",
        overview: null,
        roles: [],
        requirements: []
    };
}

export function createRoleRecord(input: {
    roleName: BackendRoleName;
    assignedTo: string;
    emailAddress: string;
    note: string;
}): BackendRoleRecord {
    return {
        id: `role-${Date.now()}`,
        roleName: input.roleName,
        assignedTo: input.assignedTo,
        emailAddress: input.emailAddress,
        note: input.note
    };
}

export function createRequirementRecord(input: {
    code: string;
    title: string;
    category: string;
    owner: string;
    priority: "High" | "Medium" | "Low";
    summary: string;
    excerpt: string;
    acceptanceCriteria: string[];
}): BackendRequirementRecord {
    return {
        id: `req-${Date.now()}`,
        code: input.code,
        title: input.title,
        category: input.category,
        owner: input.owner,
        status: "Draft",
        priority: input.priority,
        updatedAt: "Just now",
        excerpt: input.excerpt,
        summary: input.summary,
        body: [input.summary],
        acceptanceCriteria: input.acceptanceCriteria,
        linkedArtifacts: [],
        tags: [input.category, input.owner],
        traceItems: [],
        activityItems: [{ author: input.owner, text: "Created initial requirement draft.", timestamp: "Now" }]
    };
}

export function createRequirementNote(author: string, text: string) {
    return { author, text, timestamp: "Now" };
}
