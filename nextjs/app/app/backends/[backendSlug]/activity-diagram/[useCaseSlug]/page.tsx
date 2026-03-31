"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { ActivityDiagramWorkspace } from "@/app/components/app/activity-diagram-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useDiagramElementActions, useDiagramElementState } from "@/app/lib/providers/diagramElementProvider";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendActivityDiagramPage() {
  const params = useParams<{ backendSlug: string; useCaseSlug: string }>();
  const { session } = useUserState();
  const { backend, isPending: isBackendPending } = useBackendState();
  const { diagramElements, isPending: isDiagramPending } = useDiagramElementState();
  const { getBackendBySlug } = useBackendActions();
  const { getDiagramElementsByBackend } = useDiagramElementActions();

  useEffect(() => {
    getBackendBySlug(params.backendSlug).catch(() => {});
  }, [getBackendBySlug, params.backendSlug]);

  useEffect(() => {
    if (backend) {
      getDiagramElementsByBackend(backend.id).catch(() => {});
    }
  }, [backend, getDiagramElementsByBackend]);

  const useCase = useMemo(
    () =>
      diagramElements.find(
        (item) =>
          item.backendId === backend?.id &&
          item.type === "use-case" &&
          item.slug === params.useCaseSlug
      ) ?? null,
    [backend?.id, diagramElements, params.useCaseSlug]
  );
  const activityDiagram = useMemo(
    () =>
      // Reopen must bind to the persisted diagram for this backend/use-case pair instead of inventing a blank replacement.
      diagramElements.find(
        (item) =>
          item.backendId === backend?.id &&
          item.type === "activity" &&
          item.linkedUseCaseSlug === params.useCaseSlug
      ) ?? null,
    [backend?.id, diagramElements, params.useCaseSlug]
  );

  if (!hasPermission(session, APP_PERMISSIONS.activityDiagram)) {
    return <AccessPanel title="Activity Diagram" message="Your current role does not allow access to activity diagrams." />;
  }

  if (isBackendPending || isDiagramPending) {
    return (
      <section className="page-section">
        <div className="card backend-state-card">
          <div className="card-body backend-blocked-state">
            <strong>Loading activity diagram...</strong>
            <p>Resolving the backend, use case, and linked activity diagram context.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!backend || !useCase || !activityDiagram) {
    return (
      <section className="page-section">
        <div className="card backend-state-card">
          <div className="card-body backend-blocked-state">
            <strong>Activity diagram not found.</strong>
            <p>Select a valid backend use case with a linked activity diagram.</p>
          </div>
        </div>
      </section>
    );
  }

  return <ActivityDiagramWorkspace backend={backend} useCase={useCase} activityDiagram={activityDiagram} />;
}
