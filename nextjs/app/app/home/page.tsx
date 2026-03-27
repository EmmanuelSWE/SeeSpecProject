import { Icon } from "@/app/components/global/icons";
import { closedPullRequests, dashboardStats, openIssues, summaryStats } from "@/app/lib/data";

export default function HomePage() {
  return (
    <section className="page-section">
      <h1>Home page</h1>
      <div className="alert-banner">
        This is a sample Dashboard which doesn&apos;t show any server side data. However, you can develop your own
        dashboard inspired by this one and its source code.
      </div>

      <div className="hero-grid">
        {dashboardStats.map((stat, index) => (
          <article key={stat.title} className={`stat-card ${stat.tone}`}>
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

      <div className="summary-grid">
        {summaryStats.map((stat) => (
          <article key={stat.label} className="info-card">
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
