"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { changePassword } from "@/app/lib/utils/services/auth-service";
import { useUserActions, useUserState } from "@/app/lib/providers/userProvider";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { session } = useUserState();
  const { hydrateSession } = useUserActions();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword.trim() || !newPassword.trim()) {
      setErrorMessage("Enter both the current password and the new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("The new password and confirmation do not match.");
      return;
    }

    setIsSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      hydrateSession();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Password updated successfully.");
      router.push("/app/home");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page-section narrow-card">
      <div className="card">
        <div className="card-body">
          <h1>Update password</h1>
          <p>
            {session?.mustChangePassword
              ? "Your account was created with the default password. Change it before continuing."
              : "Change your current password."}
          </p>

          {errorMessage ? <p className="auth-status auth-status-error">{errorMessage}</p> : null}
          {successMessage ? <p className="auth-status auth-status-success">{successMessage}</p> : null}

          <form className="auth-form inline-form" onSubmit={handleSubmit}>
            <label>
              <span>Current password</span>
              <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            </label>
            <label>
              <span>New password</span>
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </label>
            <label>
              <span>Confirm password</span>
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </label>
            <div className="split-actions">
              <button type="button" className="secondary-button" onClick={() => router.push("/app/home")} disabled={isSaving || !!session?.mustChangePassword}>
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
