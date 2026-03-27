import Link from "next/link";

export function AuthBrand() {
  return (
    <div className="auth-brand">
      <Link href="/" className="auth-brand-link" aria-label="Go to SeeSpec home">
        <span className="auth-brand-badge">S</span>
      </Link>
    </div>
  );
}
