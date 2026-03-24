export default function UpdatePasswordPage() {
  return (
    <section className="page-section narrow-card">
      <div className="card">
        <div className="card-body">
          <h1>Update password</h1>
          <form className="auth-form inline-form">
            <label>
              <span>Current password</span>
              <input type="password" placeholder="Current password" />
            </label>
            <label>
              <span>New password</span>
              <input type="password" placeholder="New password" />
            </label>
            <label>
              <span>Confirm password</span>
              <input type="password" placeholder="Confirm password" />
            </label>
            <div className="split-actions">
              <button type="button" className="secondary-button">
                Cancel
              </button>
              <button type="submit" className="primary-button">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
