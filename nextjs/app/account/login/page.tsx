import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="auth-form-wrap">
      <h1>Log in</h1>
      <form className="auth-form">
        <label>
          <span>User name or email</span>
          <div className="input-frame">
            <input type="text" placeholder="User name or email" defaultValue="admin" />
            <span className="input-icon">U</span>
          </div>
        </label>
        <label>
          <span>Password</span>
          <div className="input-frame">
            <input type="password" placeholder="Password" defaultValue="123qwe" />
            <span className="input-icon">L</span>
          </div>
        </label>
        <div className="auth-actions">
          <label className="checkbox-row">
            <input type="checkbox" defaultChecked />
            <span>Remember me</span>
          </label>
          <Link href="/app/about" className="primary-button">
            Log in
          </Link>
        </div>
      </form>
      <p className="helper-link">
        <Link href="/account/register">Register</Link>
      </p>
    </div>
  );
}
