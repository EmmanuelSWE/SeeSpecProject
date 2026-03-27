"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthInputField } from "@/app/components/auth/auth-input-field";
import { AuthSelectField } from "@/app/components/auth/auth-select-field";
import { getActiveTenantsForLogin, type ActiveTenantLoginOption } from "@/app/lib/utils/services/auth-service";
import { useUserActions, useUserState } from "@/app/lib/providers/userProvider";

type LoginState = {
  tenantName: string;
  email: string;
  password: string;
};

const INITIAL_STATE: LoginState = {
  tenantName: "__host__",
  email: "",
  password: ""
};

export function LoginForm() {
  const router = useRouter();
  const { login } = useUserActions();
  const { isPending, isSuccess, errorMessage } = useUserState();
  const [form, setForm] = useState<LoginState>(INITIAL_STATE);
  const [tenantOptions, setTenantOptions] = useState<ActiveTenantLoginOption[]>([]);
  const [isTenantPending, setIsTenantPending] = useState(true);
  const [tenantMessage, setTenantMessage] = useState<string | null>("Loading tenants...");
  const [tenantError, setTenantError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getActiveTenantsForLogin()
      .then((tenants) => {
        if (!isMounted) {
          return;
        }

        setTenantOptions(tenants);
        setTenantMessage(tenants.length > 0 ? "Tenant list ready." : "Host tenant available. Tenant list endpoint is not available yet.");
        setTenantError(null);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setTenantMessage(null);
        setTenantError(error instanceof Error ? error.message : "Unable to load tenants right now.");
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setIsTenantPending(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const tenantSelectOptions = useMemo(
    () => [
      { value: "__host__", label: "Host Tenant" },
      ...tenantOptions.map((tenant) => ({
        value: tenant.tenancyName,
        label: tenant.name === tenant.tenancyName ? tenant.name : `${tenant.name} (${tenant.tenancyName})`
      }))
    ],
    [tenantOptions]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const tenancyName = form.tenantName.trim();

      await login({
        tenancyName: tenancyName && tenancyName !== "__host__" ? tenancyName : undefined,
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
          <AuthSelectField
            id="tenantName"
            label="Tenant name"
            value={form.tenantName}
            disabled={isPending || isTenantPending}
            options={tenantSelectOptions}
            onChange={(tenantName) => {
              setTenantError(null);
              setTenantMessage(tenantName === "__host__" ? "Host tenant selected." : "Tenant selected.");
              setForm((current) => ({ ...current, tenantName }));
            }}
          />

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
          <button type="submit" className="primary-button auth-submit-button" disabled={isPending || isTenantPending}>
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
