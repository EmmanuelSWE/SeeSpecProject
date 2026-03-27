import Link from "next/link";
import { AuthInputField } from "@/app/components/auth/auth-input-field";

export default function RegisterPage() {
  return (
    <div className="auth-form-wrap">
      <div className="auth-title-block">
        <p className="auth-kicker">Workspace Access</p>
        <h1>Register</h1>
        <p className="auth-subtitle">Create your account before joining a tenant workspace.</p>
      </div>

      <form className="auth-form">
        <AuthInputField id="name" type="text" label="Name" placeholder="Ada" value="" icon="<" onChange={() => {}} />
        <AuthInputField id="surname" type="text" label="Surname" placeholder="Lovelace" value="" icon="<" onChange={() => {}} />
        <AuthInputField
          id="email"
          type="text"
          label="Email address"
          placeholder="ada@example.com"
          value=""
          icon="@"
          onChange={() => {}}
        />
        <AuthInputField id="username" type="text" label="User name" placeholder="ada" value="" icon="U" onChange={() => {}} />
        <AuthInputField
          id="password"
          type="password"
          label="Password"
          placeholder="Create password"
          value=""
          icon="*"
          onChange={() => {}}
        />

        <div className="auth-submit-row">
          <Link href="/account/login" className="secondary-button auth-secondary-link">
            Back
          </Link>
          <button type="submit" className="primary-button auth-submit-button">
            Register
          </button>
        </div>
      </form>
    </div>
  );
}
