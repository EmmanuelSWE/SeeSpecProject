"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/app/components/global/icons";
import type { BackendRecord, BackendWorkflowReadiness } from "@/app/lib/providers/backendProvider/context";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useUserState } from "@/app/lib/providers/userProvider";

type DashboardReadinessMap = Record<string, BackendWorkflowReadiness | null>;

function buildReadinessMap(backends: BackendRecord[], readinessList: Array<BackendWorkflowReadiness | null>) {
  return backends.reduce<DashboardReadinessMap>((accumulator, backend, index) => {
    accumulator[backend.id] = readinessList[index] ?? null;
    return accumulator;
  }, {});
}

export default function HomePage() {
  const { session } = useUserState();
  const { backends } = useBackendState();
  const { getBackends, getWorkflowReadiness } = useBackendActions();
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardErrorMessage, setDashboardErrorMessage] = useState<string | null>(null);
  const [readinessByBackendId, setReadinessByBackendId] = useState<DashboardReadinessMap>({});
  const isHostContext = session?.tenantId == null;

  useEffect(() => {
    let isActive = true;

    void (async () => {
      setIsLoadingDashboard(true);
      setDashboardErrorMessage(null);

      try {
        const loadedBackends = await getBackends(true);
        const readinessList = await Promise.all(
          loadedBackends.map(async (backend) => {
            try {
              return await getWorkflowReadiness(backend.id);
            } catch {
              return null;
            }
          })
        );

        if (!isActive) {
          return;
        }

        setReadinessByBackendId(buildReadinessMap(loadedBackends, readinessList));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setDashboardErrorMessage(error instanceof Error ? error.message : "Unable to load dashboard data.");
      } finally {
        if (isActive) {
          setIsLoadingDashboard(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [getBackends, getWorkflowReadiness]);

  const activeBackendCount = backends.filter((backend) => backend.status === "Active").length;
  const archivedBackendCount = backends.filter((backend) => backend.status === "Archived").length;
  const draftBackendCount = backends.filter((backend) => backend.status === "Draft").length;
  const totalRequirementCount = backends.reduce((total, backend) => total + backend.requirements.length, 0);
  const totalUseCaseCount = backends.reduce((total, backend) => total + backend.useCases.length, 0);
  const totalDomainEntityCount = backends.reduce((total, backend) => total + backend.domainEntities.length, 0);
  const totalRoleCount = backends.reduce((total, backend) => total + backend.roles.length, 0);
  const acceptedOverviewCount = backends.filter((backend) => readinessByBackendId[backend.id]?.isOverviewAccepted).length;
  const readyForGenerationCount = backends.filter((backend) => readinessByBackendId[backend.id]?.isCodeGenerationReady).length;
  const blockedWorkflowCount = backends.filter((backend) => {
    const readiness = readinessByBackendId[backend.id];
    return readiness ? !readiness.isCodeGenerationReady : false;
  }).length;

  if (isLoadingDashboard) {
    return (
      <section className="page-section">
        <div className="card">
          <div className="card-body backend-blocked-state">
            <strong>Loading workspace dashboard...</strong>
            <p>Fetching live backend and workflow data for this session.</p>
          </div>
        </div>
      </section>
    );
  }

  if (dashboardErrorMessage) {
    return (
      <section className="page-section">
        <div className="card">
          <div className="card-body backend-blocked-state">
            <strong>Dashboard data failed to load.</strong>
            <p>{dashboardErrorMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  if (isHostContext) {
    return (
      <section className="page-section host-home">
        <div className="host-home-hero">
          <div className="host-home-copy">
            <span className="host-home-eyebrow">Host Administration</span>
            <h1>Profile</h1>
            <p>Host access is limited to your profile, system users, tenant administration, and top-level backend visibility.</p>
          </div>
          <div className="host-home-badge">
            <span>Host</span>
          </div>
        </div>

        <div className="summary-grid host-summary-grid">
          <article className="info-card host-info-card">
            <div className="info-icon blue">
              <Icon name="users" />
            </div>
            <div>
              <p>User name</p>
              <strong>{session?.userName ?? "guest"}</strong>
            </div>
          </article>

          <article className="info-card host-info-card">
            <div className="info-icon teal">
              <Icon name="building" />
            </div>
            <div>
              <p>Total backends</p>
              <strong>{backends.length}</strong>
            </div>
          </article>

          <article className="info-card host-info-card">
            <div className="info-icon gold">
              <Icon name="code" />
            </div>
            <div>
              <p>Active backends</p>
              <strong>{activeBackendCount}</strong>
            </div>
          </article>
        </div>

        <div className="card narrow-card host-panel">
          <div className="card-header">
            <h3>Profile Information</h3>
          </div>
          <div className="card-body host-profile-card">
            <dl className="host-profile-list">
              <div>
                <dt>User ID</dt>
                <dd>{session?.userId ?? "-"}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{session?.emailAddress ?? "-"}</dd>
              </div>
              <div>
                <dt>Session scope</dt>
                <dd>Host administration</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Backend inventory</h3>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Tenant</th>
                  <th>Status</th>
                  <th>Requirements</th>
                  <th>Use cases</th>
                  <th>Domain entities</th>
                </tr>
              </thead>
              <tbody>
                {backends.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No backends have been imported yet.</td>
                  </tr>
                ) : (
                  backends.map((backend) => (
                    <tr key={backend.id}>
                      <td>{backend.name}</td>
                      <td>{backend.tenantId}</td>
                      <td>{backend.status}</td>
                      <td>{backend.requirements.length}</td>
                      <td>{backend.useCases.length}</td>
                      <td>{backend.domainEntities.length}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section tenant-home">
      <div className="card tenant-home-hero tenant-dashboard-hero">
        <div className="card-body">
          <span className="host-home-eyebrow">Tenant Workspace</span>
          <h1>Workspace</h1>
          <p>
            Signed in as <strong>{session?.fullName || session?.userName}</strong> for tenant{" "}
            <strong>{session?.tenantId ?? "-"}</strong>. The dashboard below reflects your actual backend workflow state.
          </p>
          <div className="badge-row tenant-role-row">
            {(session?.roleNames ?? []).map((role) => (
              <span key={role} className="badge">
                {role}
              </span>
            ))}
            {(session?.roleNames ?? []).length === 0 ? <span className="badge">Member</span> : null}
          </div>
        </div>
      </div>

      <div className="hero-grid tenant-dashboard-grid">
        <article className="stat-card green tenant-stat-card">
          <div>
            <strong>{backends.length}</strong>
            <p>Backends</p>
          </div>
          <div className="stat-icon">
            <Icon name="code" />
          </div>
        </article>
        <article className="stat-card teal tenant-stat-card">
          <div>
            <strong>{acceptedOverviewCount}</strong>
            <p>Accepted overviews</p>
          </div>
          <div className="stat-icon">
            <Icon name="eye" />
          </div>
        </article>
        <article className="stat-card gold tenant-stat-card">
          <div>
            <strong>{totalRequirementCount}</strong>
            <p>Requirements</p>
          </div>
          <div className="stat-icon">
            <Icon name="issue" />
          </div>
        </article>
        <article className="stat-card blue tenant-stat-card">
          <div>
            <strong>{totalUseCaseCount}</strong>
            <p>Use cases</p>
          </div>
          <div className="stat-icon">
            <Icon name="group" />
          </div>
        </article>
      </div>

      <div className="summary-grid tenant-summary-grid">
        <article className="info-card tenant-info-card">
          <div className="info-icon blue">
            <Icon name="users" />
          </div>
          <div>
            <p>Project roles</p>
            <strong>{totalRoleCount}</strong>
          </div>
        </article>
        <article className="info-card tenant-info-card">
          <div className="info-icon gold">
            <Icon name="domain" />
          </div>
          <div>
            <p>Domain entities</p>
            <strong>{totalDomainEntityCount}</strong>
          </div>
        </article>
        <article className="info-card tenant-info-card">
          <div className="info-icon teal">
            <Icon name="star" />
          </div>
          <div>
            <p>Code-ready backends</p>
            <strong>{readyForGenerationCount}</strong>
          </div>
        </article>
        <article className="info-card tenant-info-card">
          <div className="info-icon green">
            <Icon name="tools" />
          </div>
          <div>
            <p>Backends with missing workflow steps</p>
            <strong>{blockedWorkflowCount}</strong>
          </div>
        </article>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Backend workflow status</h3>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Backend</th>
                <th>Status</th>
                <th>Roles</th>
                <th>Requirements</th>
                <th>Use cases</th>
                <th>Domain entities</th>
                <th>Next step</th>
              </tr>
            </thead>
            <tbody>
              {backends.length === 0 ? (
                <tr>
                  <td colSpan={7}>No backends have been imported yet.</td>
                </tr>
              ) : (
                backends.map((backend) => {
                  const readiness = readinessByBackendId[backend.id];
                  const nextStep = readiness
                    ? readiness.isCodeGenerationReady
                      ? "Ready for code generation"
                      : readiness.missingItems[0] ?? "Continue the workflow"
                    : "Workflow status unavailable";

                  return (
                    <tr key={backend.id}>
                      <td>
                        <Link href={`/app/backends/${backend.slug}/overview`}>{backend.name}</Link>
                      </td>
                      <td>{backend.status}</td>
                      <td>{backend.roles.length}</td>
                      <td>{backend.requirements.length}</td>
                      <td>{backend.useCases.length}</td>
                      <td>{backend.domainEntities.length}</td>
                      <td>{nextStep}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Generation readiness</h3>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Backend</th>
                <th>Overview</th>
                <th>Roles</th>
                <th>Requirements</th>
                <th>Domain model</th>
                <th>Generation</th>
              </tr>
            </thead>
            <tbody>
              {backends.length === 0 ? (
                <tr>
                  <td colSpan={6}>No backend readiness data is available yet.</td>
                </tr>
              ) : (
                backends.map((backend) => {
                  const readiness = readinessByBackendId[backend.id];

                  return (
                    <tr key={`${backend.id}-readiness`}>
                      <td>{backend.name}</td>
                      <td>{readiness?.isOverviewAccepted ? "Accepted" : "Pending"}</td>
                      <td>{readiness?.hasRoles ? "Ready" : "Missing"}</td>
                      <td>{readiness?.hasRequirements ? "Ready" : "Missing"}</td>
                      <td>{readiness?.hasDomainModel ? "Ready" : "Missing"}</td>
                      <td>{readiness?.isCodeGenerationReady ? "Unlocked" : "Locked"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Live totals</h3>
        </div>
        <div className="card-body">
          <div className="badge-row">
            <span className="badge">Active backends: {activeBackendCount}</span>
            <span className="badge">Draft backends: {draftBackendCount}</span>
            <span className="badge">Archived backends: {archivedBackendCount}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
