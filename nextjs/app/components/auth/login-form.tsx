"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthInputField } from "@/app/components/auth/auth-input-field";
import { checkTenantAvailability } from "@/app/lib/utils/services/auth-service";
import { useUserActions, useUserState } from "@/app/lib/providers/userProvider";

type LoginState = {
  tenantName: string;
  email: string;
  password: string;
};

const INITIAL_STATE: LoginState = {
  tenantName: "",
  email: "",
  password: ""
};

export function LoginForm() {
  const router = useRouter();
  const { login } = useUserActions();
  const { isPending, isSuccess, errorMessage } = useUserState();
  const [form, setForm] = useState<LoginState>(INITIAL_STATE);
  const [isTenantPending, setIsTenantPending] = useState(false);
  const [tenantMessage, setTenantMessage] = useState<string | null>(null);
  const [tenantError, setTenantError] = useState<string | null>(null);

  async function applyTenant(nextTenantName: string) {
    const trimmedTenantName = nextTenantName.trim();

    if (!trimmedTenantName) {
      setTenantMessage(null);
      setTenantError("Enter a tenant name before saving.");
      return;
    }

    setIsTenantPending(true);
    setTenantError(null);
    setTenantMessage("Searching for tenant...");

    try {
      const result = await checkTenantAvailability(trimmedTenantName);

      if (result.state === "Available") {
        setForm((current) => ({ ...current, tenantName: trimmedTenantName }));
        setTenantMessage(`Tenant ready: ${trimmedTenantName}`);
        return;
      }

      if (result.state === "InActive") {
        setTenantMessage(null);
        setTenantError(`Tenant "${trimmedTenantName}" is inactive.`);
        return;
      }

      setTenantMessage(null);
      setTenantError(`Tenant "${trimmedTenantName}" does not exist.`);
    } catch (error) {
      setTenantMessage(null);
      setTenantError(error instanceof Error ? error.message : "Unable to verify tenant right now.");
    } finally {
      setIsTenantPending(false);
    }
  }

  async function selectHostTenant() {
    setIsTenantPending(true);
    setTenantError(null);
    setTenantMessage("Loading host tenant...");

    await new Promise((resolve) => setTimeout(resolve, 300));

    setForm((current) => ({ ...current, tenantName: "" }));
    setTenantMessage("Host tenant selected.");
    setIsTenantPending(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const tenancyName = form.tenantName.trim();

      await login({
        tenancyName: tenancyName || undefined,
        userNameOrEmailAddress: form.email,
        password: form.password,
        rememberClient: true
      });
      router.push("/app/home");
    } catch {}
  }

  return (
    <div className="auth-form-wrap">
      <div className="auth-title-block">
        <h1>Login to SeeSpec</h1>
        <p className="auth-subtitle">Enter your workspace credentials</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-tenant-group">
          <AuthInputField
            id="tenantName"
            type="text"
            label="Tenant name"
            placeholder="Default"
            value={form.tenantName}
            icon=""
            disabled={isPending || isTenantPending}
            autoComplete="organization"
            onChange={(tenantName) => {
              setTenantMessage(null);
              setTenantError(null);
              setForm((current) => ({ ...current, tenantName }));
            }}
          />

          <div className="auth-tenant-actions">
            <button
              type="button"
              className="secondary-button auth-tenant-button"
              disabled={isPending || isTenantPending}
              onClick={() => applyTenant(form.tenantName)}
            >
              <span className={`auth-button-loader ${isTenantPending ? "is-visible" : ""}`} aria-hidden="true" />
              <span>{isTenantPending ? "Loading..." : "Save Tenant"}</span>
            </button>

            <button
              type="button"
              className="secondary-button auth-tenant-button"
              disabled={isPending || isTenantPending}
              onClick={selectHostTenant}
            >
              <span className={`auth-button-loader ${isTenantPending ? "is-visible" : ""}`} aria-hidden="true" />
              <span>{isTenantPending ? "Loading..." : "Host Tenant"}</span>
            </button>
          </div>

          {tenantMessage ? (
            <p className="auth-status auth-status-neutral" role="status" aria-live="polite">
              {tenantMessage}
            </p>
          ) : null}

          {tenantError ? (
            <p className="auth-status auth-status-error" role="alert">
              {tenantError}
            </p>
          ) : null}
        </div>

        <AuthInputField
          id="email"
          type="text"
          label="Email"
          placeholder="demo@seespec.com"
          value={form.email}
          icon=""
          disabled={isPending}
          autoComplete="username"
          onChange={(email) => setForm((current) => ({ ...current, email }))}
        />

        <AuthInputField
          id="password"
          type="password"
          label="Password"
          placeholder="password123"
          value={form.password}
          icon=""
          disabled={isPending}
          autoComplete="current-password"
          onChange={(password) => setForm((current) => ({ ...current, password }))}
        />

        <p className="auth-demo-note">Demo: Select a role to mock login</p>

        <button type="button" className="auth-role-preview" disabled>
          Host Admin
        </button>

        <div className="auth-submit-row">
          <button type="submit" className="primary-button auth-submit-button" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign In"}
          </button>
        </div>

        {isPending ? (
          <p className="auth-status auth-status-neutral" role="status" aria-live="polite">
            Logging in...
          </p>
        ) : null}

        {errorMessage ? (
          <p className="auth-status auth-status-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {isSuccess ? <p className="auth-status auth-status-success">Authentication succeeded. Redirecting...</p> : null}
      </form>

      <div className="auth-form-footer">
        <p className="auth-footer-copy">
          Don&apos;t have a workspace? <Link href="/account/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
