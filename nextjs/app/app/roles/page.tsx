"use client";

import { useEffect, useMemo, useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { getRoles, type RoleDto } from "@/app/lib/utils/services/admin-service";
import { useUserState } from "@/app/lib/providers/userProvider";

export default function RolesPage() {
  const { session } = useUserState();
  const canViewRoles = hasPermission(session, APP_PERMISSIONS.roles);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredRoles = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return roles.filter((role) => {
      if (!loweredQuery) {
        return true;
      }

      return `${role.name} ${role.displayName} ${role.description ?? ""}`.toLowerCase().includes(loweredQuery);
    });
  }, [query, roles]);

  useEffect(() => {
    if (!canViewRoles) {
      setIsLoading(false);
      return;
    }

    void loadData();
  }, [canViewRoles]);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const roleResult = await getRoles();
      setRoles(roleResult.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load roles.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!canViewRoles) {
    return <AccessPanel title="Roles" message="Your current tenant role does not allow access to role management." />;
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <h1>Roles</h1>
      </div>

      {error ? (
        <p className="auth-status auth-status-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="card">
        <div className="card-header controls">
          <h3>Tenant roles</h3>
          <div className="management-toolbar">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roles" className="search-input" />
            <button type="button" className="secondary-button" onClick={() => void loadData()}>
              Refresh
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Role name</th>
                <th>Display name</th>
                <th>Description</th>
                <th>Granted permissions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4}>Loading roles...</td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={4}>No roles found.</td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.id}>
                    <td>{role.name}</td>
                    <td>{role.displayName}</td>
                    <td>{role.description || "-"}</td>
                    <td>{role.grantedPermissions?.join(", ") || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
