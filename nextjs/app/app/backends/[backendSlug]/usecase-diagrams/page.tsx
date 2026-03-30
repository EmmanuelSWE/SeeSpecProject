"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { findBackendBySlug, type BackendRecord } from "@/app/lib/mock-backends";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendUseCaseIndexPage() {
    const params = useParams<{ backendSlug: string }>();
    const router = useRouter();
    const { session } = useUserState();
    const [backend] = useState<BackendRecord | null>(() => findBackendBySlug(params.backendSlug));

    useEffect(() => {
        if (backend && backend.useCases.length > 0) {
            router.replace(`/app/backends/${backend.slug}/usecase-diagrams/${backend.useCases[0].slug}`);
        }
    }, [backend, router]);

    if (!hasPermission(session, APP_PERMISSIONS.usecaseDiagrams)) {
        return <AccessPanel title="Use Case Diagrams" message="Your current role does not allow access to use case diagrams." />;
    }

    if (!backend || backend.useCases.length === 0) {
        return (
            <section className="page-section">
                <div className="card backend-state-card">
                    <div className="card-body backend-blocked-state">
                        <strong>No use cases are defined for this backend yet.</strong>
                        <p>Create or seed backend use cases before opening the diagram workspace.</p>
                    </div>
                </div>
            </section>
        );
    }

    return null;
}
