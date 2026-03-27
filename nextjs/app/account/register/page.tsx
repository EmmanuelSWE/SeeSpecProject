"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthInputField } from "@/app/components/auth/auth-input-field";

type RegisterFormState = {
  name: string;
  surname: string;
  email: string;
  username: string;
  password: string;
};

const INITIAL_STATE: RegisterFormState = {
  name: "",
  surname: "",
  email: "",
  username: "",
  password: ""
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterFormState>(INITIAL_STATE);

  return (
    <div className="auth-form-wrap">
      <div className="auth-title-block">
        <p className="auth-kicker">Workspace Access</p>
        <h1>Register</h1>
        <p className="auth-subtitle">Create your account before joining a tenant workspace.</p>
      </div>

      <form className="auth-form">
        <AuthInputField
          id="name"
          type="text"
          label="Name"
          placeholder="Ada"
          value={form.name}
          icon="<"
          onChange={(name) => setForm((current) => ({ ...current, name }))}
        />
        <AuthInputField
          id="surname"
          type="text"
          label="Surname"
          placeholder="Lovelace"
          value={form.surname}
          icon="<"
          onChange={(surname) => setForm((current) => ({ ...current, surname }))}
        />
        <AuthInputField
          id="email"
          type="text"
          label="Email address"
          placeholder="ada@example.com"
          value={form.email}
          icon="@"
          onChange={(email) => setForm((current) => ({ ...current, email }))}
        />
        <AuthInputField
          id="username"
          type="text"
          label="User name"
          placeholder="ada"
          value={form.username}
          icon="U"
          onChange={(username) => setForm((current) => ({ ...current, username }))}
        />
        <AuthInputField
          id="password"
          type="password"
          label="Password"
          placeholder="Create password"
          value={form.password}
          icon="*"
          onChange={(password) => setForm((current) => ({ ...current, password }))}
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
