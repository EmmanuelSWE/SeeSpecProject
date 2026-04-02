"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { ActivityDiagramWorkspace } from "@/app/components/app/activity-diagram-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { withAuth, type WithAuthProps } from "@/app/lib/auth/with-auth";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useDiagramElementActions, useDiagramElementState } from "@/app/lib/providers/diagramElementProvider";
import { useSpecSectionActions, useSpecSectionState } from "@/app/lib/providers/specSectionProvider";
import { selectOverviewSection } from "@/app/lib/workflow/overview-gate";

const WORKFLOW_ROLES = ["Host Admin", "Tenant Admin", "Business Analyst", "System Architect", "Project Lead"] as const;

function BackendActivityDiagramPage({ session }: WithAuthProps) {
  const params = useParams<{ backendSlug: string; useCaseSlug: string; nodeId: string }>();
  const backendSlug = params?.backendSlug ?? null;
  const useCaseSlug = params?.useCaseSlug ?? null;
  const nodeId = params?.nodeId ?? null;
  const routeErrorMessage = backendSlug ? null : "Unable to resolve this backend route.";
  const router = useRouter();
  const { backend } = useBackendState();
  const { diagramElements } = useDiagramElementState();
  const { getBackendBySlug } = useBackendActions();
  const { getDiagramElementsByBackend } = useDiagramElementActions();
  const { sections } = useSpecSectionState();
  const { getSectionsByBackend } = useSpecSectionActions();
  const [hasResolvedBackend, setHasResolvedBackend] = useState(false);
  const [hasResolvedDiagrams, setHasResolvedDiagrams] = useState(false);
  const [pageErrorMessage, setPageErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!backendSlug) {
      return () => {
        isActive = false;
      };
    }

    getBackendBySlug(backendSlug)
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
  }, [backendSlug, getBackendBySlug]);

  useEffect(() => {
    let isActive = true;
    if (backend) {
      Promise.all([
        getDiagramElementsByBackend(backend.id),
        getSectionsByBackend(backend.id)
      ])
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
  }, [backend, getDiagramElementsByBackend, getSectionsByBackend]);

  const useCase = useMemo(
    () =>
      diagramElements.find(
        (item) =>
          item.backendId === backend?.id &&
          item.type === "use-case" &&
          item.slug === useCaseSlug
      ) ?? null,
    [backend?.id, diagramElements, useCaseSlug]
  );
  const activityDiagram = useMemo(
    () =>
      diagramElements.find(
        (item) =>
          item.backendId === backend?.id &&
          item.type === "activity" &&
          item.linkedUseCaseSlug === useCaseSlug &&
          item.linkedUseCaseNodeId === nodeId
      ) ?? null,
    [backend?.id, diagramElements, nodeId, useCaseSlug]
  );
  const overviewSection = useMemo(
    () => selectOverviewSection(sections, backend?.slug ?? null),
    [backend?.slug, sections]
  );
  const canViewDiagram = hasPermission(session, APP_PERMISSIONS.diagramsView);
  const canEditDiagram = hasPermission(session, APP_PERMISSIONS.diagramsEdit);

  useEffect(() => {
    if (!backend || !hasResolvedBackend || !hasResolvedDiagrams) {
      return;
    }

    if (!overviewSection || !overviewSection.isAccepted) {
      router.replace(`/app/backends/${backend.slug}/overview`);
    }
  }, [backend, hasResolvedBackend, hasResolvedDiagrams, overviewSection, router]);

  if (!canViewDiagram) {
    return <AccessPanel title="Activity Diagram" message="Your current role does not allow access to activity diagrams." />;
  }

  if (routeErrorMessage || pageErrorMessage) {
    return (
      <section className="page-section">
        <div className="card backend-state-card">
          <div className="card-body backend-blocked-state">
            <strong>Activity diagram failed to load.</strong>
            <p>{routeErrorMessage ?? pageErrorMessage}</p>
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
            <p>Fetching the stored use case and its linked activity diagram.</p>
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
            <p>Select a stored use case from the use case diagram page first.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!overviewSection || !overviewSection.isAccepted) {
    return null;
  }

  return <ActivityDiagramWorkspace backend={backend} useCase={useCase} activityDiagram={activityDiagram} canEditDiagram={canEditDiagram} />;
}

export default withAuth(BackendActivityDiagramPage, { roles: [...WORKFLOW_ROLES] });
