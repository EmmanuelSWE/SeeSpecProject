import Link from "next/link";
import { languages, versionText } from "@/lib/data";

function Flag({ code }: { code: string }) {
  return <span className="flag">{code}</span>;
}

export function AccountShell({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="auth-page">
      <div className="auth-stack">
        <div className="auth-logo">
          <Link href="/">
            <strong>SeeSpec</strong>
          </Link>
        </div>

        <div className="auth-card">
          <div className="tenant-banner">
            Current tenant: Not selected <button type="button">Change</button>
          </div>
          <div className="auth-card-body">{children}</div>
          <div className="auth-card-footer">
            <div className="language-row">
              {languages.map((language) => (
                <span key={language.code} className="language-chip">
                  <Flag code={language.flag} />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="auth-footer">
          Copyright &copy; {currentYear} <b>Version</b> {versionText}
        </div>
      </div>
    </div>
  );
}
