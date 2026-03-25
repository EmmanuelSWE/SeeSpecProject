import Link from "next/link";
import { languages, versionText } from "@/lib/data";

function Flag({ code }: { code: string }) {
  return <span className="flag">{code}</span>;
}

export function AccountShell({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="auth-page">
      <div className="login-box">
        <div className="login-logo">
          <Link href="/">
            <strong>SeeSpec</strong>
          </Link>
        </div>

        <div className="auth-card card">
          <div className="auth-card-header">
            Current tenant: Not selected <button type="button">Change</button>
          </div>
          <div className="auth-card-body login-card-body">{children}</div>
          <div className="auth-card-footer card-footer">
            <div className="account-languages">
              {languages.map((language) => (
                <span key={language.code} className="language-chip">
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
  );
}
