"use client";

import type { BackendDto, BackendOverviewDto, BackendRoleName } from "@/app/lib/utils/services/backend-service";

export function BackendInputField({
    label,
    value,
    onChange,
    placeholder,
    textarea = false,
    type = "text"
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    textarea?: boolean;
    type?: "text" | "email" | "url";
}) {
    return (
        <label className="backend-form-field">
            <span>{label}</span>
            {textarea ? (
                <textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} rows={4} />
            ) : (
                <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
            )}
        </label>
    );
}

export function BackendSelectField<TValue extends string>({
    label,
    value,
    options,
    onChange
}: {
    label: string;
    value: TValue;
    options: readonly TValue[];
    onChange: (value: TValue) => void;
}) {
    return (
        <label className="backend-form-field">
            <span>{label}</span>
            <select value={value} onChange={(event) => onChange(event.target.value as TValue)}>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </label>
    );
}

export type BackendFormState = Pick<
    BackendDto,
    "name" | "framework" | "runtimeVersion" | "repositoryUrl" | "description" | "status"
>;

export function BackendFormFields({
    value,
    onChange
}: {
    value: BackendFormState;
    onChange: (next: BackendFormState) => void;
}) {
    return (
        <div className="backend-form-grid">
            <BackendInputField label="Backend name" value={value.name} placeholder="Payments Core" onChange={(name) => onChange({ ...value, name })} />
            <BackendInputField label="Framework" value={value.framework} placeholder="ABP Application" onChange={(framework) => onChange({ ...value, framework })} />
            <BackendInputField label="Runtime version" value={value.runtimeVersion} placeholder=".NET 8" onChange={(runtimeVersion) => onChange({ ...value, runtimeVersion })} />
            <BackendSelectField
                label="Status"
                value={value.status}
                options={["Draft", "Active", "Archived"] as const}
                onChange={(status) => onChange({ ...value, status })}
            />
            <BackendInputField
                label="Repository URL"
                type="url"
                value={value.repositoryUrl}
                placeholder="https://git.example.local/backend"
                onChange={(repositoryUrl) => onChange({ ...value, repositoryUrl })}
            />
            <BackendInputField
                label="Description"
                textarea
                value={value.description}
                placeholder="Describe the backend boundary, responsibilities, and main flows."
                onChange={(description) => onChange({ ...value, description })}
            />
        </div>
    );
}

export type OverviewFormState = BackendOverviewDto;

export function BackendOverviewFormFields({
    value,
    onChange
}: {
    value: OverviewFormState;
    onChange: (next: OverviewFormState) => void;
}) {
    return (
        <div className="backend-form-grid">
            <BackendInputField label="System overview" textarea value={value.summary} placeholder="Describe what this backend is responsible for." onChange={(summary) => onChange({ ...value, summary })} />
            <BackendInputField label="Scope" textarea value={value.scope} placeholder="Describe the functional boundary and included modules." onChange={(scope) => onChange({ ...value, scope })} />
            <BackendInputField label="Goals" textarea value={value.goals} placeholder="Describe the operational and delivery goals for this backend." onChange={(goals) => onChange({ ...value, goals })} />
        </div>
    );
}

export type BackendRoleFormState = {
    roleName: BackendRoleName;
    assignedTo: string;
    emailAddress: string;
    note: string;
};

export function BackendRoleFormFields({
    value,
    onChange
}: {
    value: BackendRoleFormState;
    onChange: (next: BackendRoleFormState) => void;
}) {
    return (
        <div className="backend-form-grid">
            <BackendSelectField
                label="Project role"
                value={value.roleName}
                options={["Tenant Admin", "Project Lead", "Business Analyst", "System Architect"] as const}
                onChange={(roleName) => onChange({ ...value, roleName })}
            />
            <BackendInputField label="Assigned to" value={value.assignedTo} placeholder="Ava Morgan" onChange={(assignedTo) => onChange({ ...value, assignedTo })} />
            <BackendInputField label="Email address" type="email" value={value.emailAddress} placeholder="ava@tenant.local" onChange={(emailAddress) => onChange({ ...value, emailAddress })} />
            <BackendInputField label="Responsibility note" textarea value={value.note} placeholder="Owns requirements review and acceptance criteria." onChange={(note) => onChange({ ...value, note })} />
        </div>
    );
}

export type BackendRequirementFormState = {
    code: string;
    title: string;
    category: string;
    owner: string;
    priority: "High" | "Medium" | "Low";
    summary: string;
    excerpt: string;
    acceptanceCriteria: string;
};

export function BackendRequirementFormFields({
    value,
    onChange
}: {
    value: BackendRequirementFormState;
    onChange: (next: BackendRequirementFormState) => void;
}) {
    return (
        <div className="backend-form-grid">
            <BackendInputField label="Requirement code" value={value.code} placeholder="REQ-01" onChange={(code) => onChange({ ...value, code })} />
            <BackendInputField label="Title" value={value.title} placeholder="Tenant-scoped payment approval" onChange={(title) => onChange({ ...value, title })} />
            <BackendInputField label="Category" value={value.category} placeholder="Core" onChange={(category) => onChange({ ...value, category })} />
            <BackendInputField label="Owner" value={value.owner} placeholder="Business Analyst" onChange={(owner) => onChange({ ...value, owner })} />
            <BackendSelectField
                label="Priority"
                value={value.priority}
                options={["High", "Medium", "Low"] as const}
                onChange={(priority) => onChange({ ...value, priority })}
            />
            <BackendInputField label="Summary" textarea value={value.summary} placeholder="Summarize the requirement intent." onChange={(summary) => onChange({ ...value, summary })} />
            <BackendInputField label="Excerpt" textarea value={value.excerpt} placeholder="Short card description." onChange={(excerpt) => onChange({ ...value, excerpt })} />
            <BackendInputField
                label="Acceptance criteria"
                textarea
                value={value.acceptanceCriteria}
                placeholder="One criterion per line."
                onChange={(acceptanceCriteria) => onChange({ ...value, acceptanceCriteria })}
            />
        </div>
    );
}
