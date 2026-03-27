"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authenticate } from "@/app/lib/utils/services/auth-service";

type LoginState = {
  userNameOrEmailAddress: string;
  password: string;
  rememberClient: boolean;
};

const INITIAL_STATE: LoginState = {
  userNameOrEmailAddress: "admin",
  password: "123qwe",
  rememberClient: true
};

export function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState<LoginState>(INITIAL_STATE);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setIsSuccess(false);
    setErrorMessage(null);

    try {
      const result = await authenticate(form);
      localStorage.setItem("seespec.accessToken", result.accessToken);
      localStorage.setItem("seespec.encryptedAccessToken", result.encryptedAccessToken);
      localStorage.setItem("seespec.userId", String(result.userId));
      setIsSuccess(true);
      router.push("/app/home");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="auth-form-wrap account-view">
      <div className="auth-title-block">
        <h4 className="text-center">Sign in</h4>
        <p className="auth-subtitle">Use your tenant account to enter the workspace.</p>
      </div>

      <form className="auth-form compact-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="auth-label" htmlFor="username">
            Username or email
          </label>
          <div className="input-group">
            <input
              id="username"
              type="text"
              className="form-control"
              placeholder="admin"
              value={form.userNameOrEmailAddress}
              onChange={(event) => setForm((current) => ({ ...current, userNameOrEmailAddress: event.target.value }))}
              disabled={isPending}
              autoComplete="username"
              required
            />
            <div className="input-group-append">
              <div className="input-group-text">U</div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="auth-label" htmlFor="password">
            Password
          </label>
          <div className="input-group">
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              disabled={isPending}
              autoComplete="current-password"
              required
            />
            <div className="input-group-append">
              <div className="input-group-text">L</div>
            </div>
          </div>
        </div>

        <div className="form-row auth-submit-row">
          <div className="form-col remember-col">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={form.rememberClient}
                onChange={(event) => setForm((current) => ({ ...current, rememberClient: event.target.checked }))}
                disabled={isPending}
              />
              <span>Remember me</span>
            </label>
          </div>
          <div className="form-col submit-col">
            <button type="submit" className="primary-button full-width" disabled={isPending}>
              {isPending ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </div>

        {errorMessage ? (
          <p className="auth-status auth-status-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {isSuccess ? <p className="auth-status auth-status-success">Authentication succeeded. Redirecting...</p> : null}
      </form>

      <div className="auth-form-footer">
        <p className="register-link">
          <Link href="/account/register">Create an account</Link>
        </p>
        <p className="auth-helper-text">
          Backend endpoint: <code>/api/TokenAuth/Authenticate</code>
        </p>
      </div>
    </div>
  );
}
