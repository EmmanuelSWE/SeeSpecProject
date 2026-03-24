import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="auth-form-wrap">
      <h1>Register</h1>
      <form className="auth-form">
        <label>
          <span>Name</span>
          <input type="text" placeholder="Name" />
        </label>
        <label>
          <span>Surname</span>
          <input type="text" placeholder="Surname" />
        </label>
        <label>
          <span>Email address</span>
          <input type="email" placeholder="Email address" />
        </label>
        <label>
          <span>User name</span>
          <input type="text" placeholder="User name" />
        </label>
        <label>
          <span>Password</span>
          <input type="password" placeholder="Password" />
        </label>
        <div className="split-actions">
          <Link href="/account/login" className="secondary-button">
            Back
          </Link>
          <button type="submit" className="primary-button">
            Register
          </button>
        </div>
      </form>
    </div>
  );
}
