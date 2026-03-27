import Link from "next/link";
import { languages, versionText } from "@/app/lib/data";

function Flag({ code }: { code: string }) {
  return <span className="flag">{code}</span>;
}

export function AccountShell({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="auth-page">
      <div className="auth-grid">
        <section className="auth-intro">
          <p className="auth-kicker">Structured delivery workspace</p>
          <h1>SeeSpec</h1>
          <p className="auth-description">
            Turn diagrams into a living specification, coordinate role-based delivery, and generate ABP-aligned backend
            scaffolding from a project-owned source of truth.
          </p>
          <div className="auth-highlights">
            <article className="auth-highlight-card">
              <strong>Role-aware editing</strong>
              <p>Requirement, architecture, and domain ownership stay explicit across the workspace.</p>
            </article>
            <article className="auth-highlight-card">
              <strong>Traceable generation</strong>
              <p>Generation snapshots and completion notes preserve context for every meaningful change.</p>
            </article>
            <article className="auth-highlight-card">
              <strong>ABP + PostgreSQL</strong>
              <p>Backend structure, permissions, and migrations stay aligned with the target stack.</p>
            </article>
          </div>
        </section>

        <div className="login-box">
          <div className="login-logo">
            <Link href="/">
              <strong>SeeSpec</strong>
            </Link>
          </div>

          <div className="auth-card card">
            <div className="auth-card-header">
              <span>Workspace access</span>
              <button type="button">Tenant: default</button>
            </div>
            <div className="auth-card-body login-card-body">{children}</div>
            <div className="auth-card-footer card-footer">
              <div className="account-languages">
                {languages.map((language) => (
                  <span key={language.code} className="language-chip" title={language.label}>
                    <Flag code={language.flag} />
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="account-footer">
            <small>
              Copyright &copy; {currentYear} <b>Version</b> {versionText}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
