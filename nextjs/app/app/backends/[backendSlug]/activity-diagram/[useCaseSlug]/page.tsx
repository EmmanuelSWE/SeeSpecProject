"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { ActivityDiagramWorkspace } from "@/app/components/app/activity-diagram-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useDiagramElementActions, useDiagramElementState } from "@/app/lib/providers/diagramElementProvider";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function BackendActivityDiagramPage() {
  const params = useParams<{ backendSlug: string; useCaseSlug: string }>();
  const { session } = useUserState();
  const { backend } = useBackendState();
  const { diagramElements } = useDiagramElementState();
  const { getBackendBySlug } = useBackendActions();
  const { getDiagramElementsByBackend } = useDiagramElementActions();
  const [hasResolvedBackend, setHasResolvedBackend] = useState(false);
  const [hasResolvedDiagrams, setHasResolvedDiagrams] = useState(false);
  const [pageErrorMessage, setPageErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    getBackendBySlug(params.backendSlug)
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setPageErrorMessage(error instanceof Error ? error.message : "Unable to load this backend.");
      })
      .finally(() => {
        if (isActive) {
          setHasResolvedBackend(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, [getBackendBySlug, params.backendSlug]);

  useEffect(() => {
    let isActive = true;
    if (backend) {
      getDiagramElementsByBackend(backend.id)
        .catch((error) => {
          if (!isActive) {
            return;
          }

          setPageErrorMessage(error instanceof Error ? error.message : "Unable to load activity diagram data.");
        })
        .finally(() => {
          if (isActive) {
            setHasResolvedDiagrams(true);
          }
        });
      return () => {
        isActive = false;
      };
    }
    return () => {
      isActive = false;
    };
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

  if (pageErrorMessage) {
    return (
      <section className="page-section">
        <div className="card backend-state-card">
          <div className="card-body backend-blocked-state">
            <strong>Activity diagram failed to load.</strong>
            <p>{pageErrorMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!hasResolvedBackend || (backend !== null && !hasResolvedDiagrams)) {
    return (
      <section className="page-section">
        <div className="card backend-state-card">
          <div className="card-body backend-blocked-state">
            <strong>Loading activity diagram...</strong>
            <p>Fetching the use case and its linked activity diagram for this backend.</p>
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
