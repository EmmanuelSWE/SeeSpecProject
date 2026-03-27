import type { ReactNode } from "react";

export function AuthCardFrame({ children }: { children: ReactNode }) {
  return (
    <section className="auth-card-frame card">
      <div className="auth-card-frame-body">{children}</div>
    </section>
  );
}
