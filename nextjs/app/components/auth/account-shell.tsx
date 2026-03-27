import { AuthBrand } from "./auth-brand";
import { AuthCardFrame } from "./auth-card-frame";

export function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <AuthCardFrame>
          <div className="auth-card-stack">
            <AuthBrand />
            {children}
          </div>
        </AuthCardFrame>
      </div>
    </div>
  );
}
