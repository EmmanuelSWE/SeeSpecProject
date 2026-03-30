"use client";

import Link from "next/link";
import { Icon } from "@/app/components/global/icons";
import { closedPullRequests, dashboardStats, openIssues, summaryStats } from "@/app/lib/data";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function HomePage() {
  const { session } = useUserState();
  const isHostContext = session?.tenantId == null;

  if (isHostContext) {
    return (
      <section className="page-section host-home">
        <div className="host-home-hero">
          <div className="host-home-copy">
            <span className="host-home-eyebrow">Host Administration</span>
            <h1>Profile</h1>
            <p>Host access is limited to your profile, system users, and tenant administration.</p>
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
              <Icon name="info" />
            </div>
            <div>
              <p>Full name</p>
              <strong>{session?.fullName || "Not available"}</strong>
            </div>
          </article>

          <article className="info-card host-info-card">
            <div className="info-icon gold">
              <Icon name="building" />
            </div>
            <div>
              <p>Scope</p>
              <strong>Host administration</strong>
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

        <div className="summary-grid host-summary-grid">
          <Link href="/app/users" className="info-card host-link-card">
            <div className="info-icon blue">
              <Icon name="users" />
            </div>
            <div>
              <p>System users</p>
              <strong>Open Users</strong>
            </div>
          </Link>

          <Link href="/app/tenants" className="info-card host-link-card">
            <div className="info-icon teal">
              <Icon name="building" />
            </div>
            <div>
              <p>Tenants</p>
              <strong>Open Tenants</strong>
            </div>
          </Link>
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
            <strong>{session?.tenantId ?? "-"}</strong>. Visible pages are driven by your backend permissions.
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
        {dashboardStats.map((stat, index) => (
          <article key={stat.title} className={`stat-card ${stat.tone} tenant-stat-card`}>
            <div>
              <strong>{stat.value}</strong>
              <p>{stat.title}</p>
            </div>
            <div className="stat-icon">
              <Icon name={index === 0 ? "star" : index === 1 ? "group" : index === 2 ? "tools" : "code"} />
            </div>
            <a href={stat.link} target="_blank" rel="noreferrer">
              More info
            </a>
          </article>
        ))}
      </div>

      <div className="summary-grid tenant-summary-grid">
        {summaryStats.map((stat) => (
          <article key={stat.label} className="info-card tenant-info-card">
            <div className={`info-icon ${stat.tone}`}>
              <Icon
                name={
                  stat.label === "Commits"
                    ? "commit"
                    : stat.label === "Issues"
                      ? "issue"
                      : stat.label === "Releases"
                        ? "tag"
                        : "eye"
                }
              />
            </div>
            <div>
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
            </div>
          </article>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Open Issues</h3>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Title</th>
                <th>Labels</th>
                <th>Date</th>
                <th>Opened by</th>
              </tr>
            </thead>
            <tbody>
              {openIssues.map((issue) => (
                <tr key={issue.id}>
                  <td><a href={issue.href}>{issue.id}</a></td>
                  <td>{issue.title}</td>
                  <td>
                    <div className="badge-row">
                      {issue.labels.map((label) => (
                        <span key={label} className="badge">
                          {label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{issue.date}</td>
                  <td>{issue.author}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Closed Pull Requests</h3>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Title</th>
                <th>Milestone</th>
                <th>Date</th>
                <th>Made by</th>
              </tr>
            </thead>
            <tbody>
              {closedPullRequests.map((pullRequest) => (
                <tr key={pullRequest.id}>
                  <td><a href={pullRequest.href}>{pullRequest.id}</a></td>
                  <td>{pullRequest.title}</td>
                  <td>{pullRequest.milestone}</td>
                  <td>{pullRequest.date}</td>
                  <td>{pullRequest.author}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </section>
  );
}
