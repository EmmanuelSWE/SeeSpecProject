import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="auth-form-wrap account-view">
      <h4 className="text-center">Log in</h4>
      <form className="auth-form compact-form">
        <div className="form-group">
          <div className="input-group">
            <input type="text" className="form-control" placeholder="User name or email" defaultValue="admin" />
            <div className="input-group-append">
              <div className="input-group-text">U</div>
            </div>
          </div>
        </div>
        <div className="form-group">
          <div className="input-group">
            <input type="password" className="form-control" placeholder="Password" defaultValue="123qwe" />
            <div className="input-group-append">
              <div className="input-group-text">L</div>
            </div>
          </div>
        </div>
        <div className="form-row auth-submit-row">
          <div className="form-col remember-col">
            <label className="remember-me">
              <input type="checkbox" defaultChecked />
              <span>Remember me</span>
            </label>
          </div>
          <div className="form-col submit-col">
            <Link href="/app/about" className="primary-button full-width">
              Log in
            </Link>
          </div>
        </div>
      </form>
      <p className="register-link">
        <Link href="/account/register">Register</Link>
      </p>
    </div>
  );
}
