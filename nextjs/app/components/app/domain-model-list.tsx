"use client";

import Link from "next/link";
import type { BackendDto } from "@/app/lib/utils/services/backend-service";

function dedupeBackends(backends: BackendDto[]) {
    const seen = new Set<string>();
    const uniqueBackends: BackendDto[] = [];

    for (const backend of backends) {
        if (seen.has(backend.id)) {
            continue;
        }

        seen.add(backend.id);
        uniqueBackends.push(backend);
    }

    return uniqueBackends;
}

export function DomainModelList({ backends }: { backends: BackendDto[] }) {
    const uniqueBackends = dedupeBackends(backends);

    return (
        <section className="page-section backend-page">
            <div className="card backend-hero-card">
                <div className="card-body backend-hero-body">
                    <div className="backend-hero-copy">
                        <span className="requirements-eyebrow">Domain Models</span>
                        <h1>Tenant domain models</h1>
                        <p>Review the domain model available for each backend and open the specific model workspace from here.</p>
                    </div>
                    <span className="requirements-count-pill">{uniqueBackends.length}</span>
                </div>
            </div>

            <div className="backend-summary-grid">
                {uniqueBackends.map((backend) => (
                    <Link key={backend.id} href={`/app/backends/${backend.slug}/domain-model`} className="card domain-model-list-card">
                        <div className="card-body domain-model-list-body">
                            <span className="requirements-eyebrow">Backend</span>
                            <strong>{backend.name}</strong>
                            <p>{backend.description}</p>
                            <div className="badge-row">
                                <span className="badge">{backend.domainEntities.length} entities</span>
                                <span className="badge">{backend.domainRelationships.length} relationships</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
