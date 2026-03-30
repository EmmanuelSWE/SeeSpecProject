"use client";

import Link from "next/link";
import type { BackendRecord } from "@/app/lib/mock-backends";

export function BackendsTable({
    backends,
    onCreate,
    onEdit
}: {
    backends: BackendRecord[];
    onCreate: () => void;
    onEdit: (backend: BackendRecord) => void;
}) {
    return (
        <section className="page-section backend-page">
            <div className="card backend-hero-card">
                <div className="card-body backend-hero-body">
                    <div className="backend-hero-copy">
                        <span className="requirements-eyebrow">Backend Inventory</span>
                        <h1>Backends</h1>
                        <p>
                            Review the backend systems your tenant can inspect. Open a backend to define its overview,
                            assign project roles, and continue into requirements.
                        </p>
                    </div>
                    <button type="button" className="requirements-action-button" onClick={onCreate}>
                        New backend
                    </button>
                </div>
            </div>

            <div className="card backend-table-card">
                <div className="card-header backend-table-header">
                    <div>
                        <span className="requirements-eyebrow">Workspace Systems</span>
                        <h3>Available backends</h3>
                    </div>
                    <span className="requirements-count-pill">{backends.length}</span>
                </div>
                <div className="table-wrap">
                    <table className="data-table backend-table">
                        <thead>
                            <tr>
                                <th>Backend</th>
                                <th>Stack</th>
                                <th>Status</th>
                                <th>Overview</th>
                                <th>Roles</th>
                                <th>Requirements</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {backends.map((backend) => (
                                <tr key={backend.id}>
                                    <td>
                                        <div className="backend-table-primary">
                                            <strong>{backend.name}</strong>
                                            <span>{backend.description}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="backend-table-secondary">
                                            <span>{backend.framework}</span>
                                            <span>{backend.runtimeVersion}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`requirements-status requirements-status-${backend.status.toLowerCase()}`}>
                                            {backend.status}
                                        </span>
                                    </td>
                                    <td>{backend.overview ? "Ready" : "Required"}</td>
                                    <td>{backend.roles.length}</td>
                                    <td>{backend.requirements.length}</td>
                                    <td>
                                        <div className="backend-table-actions">
                                            <Link href={`/app/backends/${backend.slug}/overview`} className="secondary-button small">
                                                Open
                                            </Link>
                                            <Link href={`/app/backends/${backend.slug}/usecase-diagrams`} className="secondary-button small">
                                                Use cases
                                            </Link>
                                            <button
                                                type="button"
                                                className="secondary-button small"
                                                onClick={() => onEdit(backend)}
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
