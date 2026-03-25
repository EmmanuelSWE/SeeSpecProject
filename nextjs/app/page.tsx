export default function RootPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="landing-kicker">Visual spec-driven development</p>
          <h1>SeeSpec</h1>
          <p className="landing-description">
            Design systems visually, turn diagrams into a living specification, and generate ABP-ready backend scaffolding.
          </p>
          <div className="landing-actions">
            <a href="/account/login" className="primary-button">
              Log in
            </a>
            <a href="/account/register" className="secondary-button">
              Register
            </a>
          </div>
        </div>

        <div className="landing-panel card">
          <div className="landing-panel-header">Platform flow</div>
          <div className="landing-steps">
            <div className="landing-step">
              <strong>1. Model</strong>
              <p>Create UML-style diagrams that define entities, services, and flows.</p>
            </div>
            <div className="landing-step">
              <strong>2. Sync</strong>
              <p>Convert diagram structure into ordered specification sections and dependencies.</p>
            </div>
            <div className="landing-step">
              <strong>3. Generate</strong>
              <p>Produce backend scaffolding and validate it against the current design state.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-links">
        <a href="/app/about" className="card landing-link-card">
          <h2>About</h2>
          <p>Read the product context and documentation summary.</p>
        </a>
        <a href="/app/home" className="card landing-link-card">
          <h2>Dashboard</h2>
          <p>Open the admin shell and sample overview pages.</p>
        </a>
        <a href="/app/users" className="card landing-link-card">
          <h2>Admin Pages</h2>
          <p>Browse the mirrored users, roles, and tenants interfaces.</p>
        </a>
      </section>
    </main>
  );
}
