import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="auth-form-wrap account-view">
      <h4 className="text-center">Register</h4>
      <form className="auth-form compact-form">
        <div className="form-group">
          <div className="input-group">
            <input type="text" className="form-control" placeholder="Name" />
            <div className="input-group-append">
              <div className="input-group-text">&lt;</div>
            </div>
          </div>
        </div>
        <div className="form-group">
          <div className="input-group">
            <input type="text" className="form-control" placeholder="Surname" />
            <div className="input-group-append">
              <div className="input-group-text">&lt;</div>
            </div>
          </div>
        </div>
        <div className="form-group">
          <div className="input-group">
            <input type="email" className="form-control" placeholder="Email address" />
            <div className="input-group-append">
              <div className="input-group-text">@</div>
            </div>
          </div>
        </div>
        <div className="form-group">
          <div className="input-group">
            <input type="text" className="form-control" placeholder="User name" />
            <div className="input-group-append">
              <div className="input-group-text">U</div>
            </div>
          </div>
        </div>
        <div className="form-group">
          <div className="input-group">
            <input type="password" className="form-control" placeholder="Password" />
            <div className="input-group-append">
              <div className="input-group-text">L</div>
            </div>
          </div>
        </div>
        <div className="form-row register-actions">
          <div className="form-col wide-col">
            <Link href="/account/login" className="secondary-button auth-back-button">
              Back
            </Link>
          </div>
          <div className="form-col narrow-col">
            <button type="submit" className="primary-button full-width">
              Register
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
