"use client";

import { useEffect, useMemo, useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { APP_PERMISSIONS, hasAnyPermission, hasPermission } from "@/app/lib/auth/permissions";
import { useUserState } from "@/app/lib/providers/userProvider";
import {
  activateUser,
  createUser,
  deactivateUser,
  deleteUser,
  getUserRoles,
  getUsers,
  type CreateUserInput,
  type RoleDto,
  type UpdateUserInput,
  type UserDto,
  updateUser
} from "@/app/lib/utils/services/admin-service";

type UserFormState = {
  id: number | null;
  userName: string;
  name: string;
  surname: string;
  emailAddress: string;
  password: string;
  isActive: boolean;
  roleNames: string[];
};

const INITIAL_FORM: UserFormState = {
  id: null,
  userName: "",
  name: "",
  surname: "",
  emailAddress: "",
  password: "",
  isActive: true,
  roleNames: []
};

export default function UsersPage() {
  const { session } = useUserState();
  const canViewUsers = hasAnyPermission(session, [
    APP_PERMISSIONS.users,
    APP_PERMISSIONS.teamView,
    APP_PERMISSIONS.teamViewAll,
    APP_PERMISSIONS.teamAddPeople,
    APP_PERMISSIONS.teamEditPeople
  ]);
  const canCreateUsers = hasAnyPermission(session, [APP_PERMISSIONS.usersCreate, APP_PERMISSIONS.teamAddPeople]);
  const canEditUsers = hasAnyPermission(session, [APP_PERMISSIONS.usersEdit, APP_PERMISSIONS.teamEditPeople]);
  const canDeleteUsers = hasAnyPermission(session, [APP_PERMISSIONS.usersDelete, APP_PERMISSIONS.teamRemovePeople]);
  const canToggleActivation = hasPermission(session, APP_PERMISSIONS.usersEdit);
  const canAssignRolesFreely = hasPermission(session, APP_PERMISSIONS.usersAssignRoles);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [query, setQuery] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(INITIAL_FORM);

  const isEditing = form.id !== null;

  const filteredUsers = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      if (
        loweredQuery &&
        ![user.userName, user.fullName ?? `${user.name} ${user.surname}`, user.emailAddress]
          .join(" ")
          .toLowerCase()
          .includes(loweredQuery)
      ) {
        return false;
      }

      if (isActiveFilter === "all") {
        return true;
      }

      return isActiveFilter === "active" ? user.isActive : !user.isActive;
    });
  }, [isActiveFilter, query, users]);

  useEffect(() => {
    if (!canViewUsers) {
      setIsLoading(false);
      return;
    }

    void loadData();
  }, [canViewUsers]);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [userResult, roleResult] = await Promise.all([getUsers(), getUserRoles()]);
      setUsers(userResult.items);
      setRoles(roleResult);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setForm(INITIAL_FORM);
  }

  function startEdit(user: UserDto) {
    setStatusMessage(null);
    setError(null);
    setForm({
      id: user.id,
      userName: user.userName,
      name: user.name,
      surname: user.surname,
      emailAddress: user.emailAddress,
      password: "",
      isActive: user.isActive,
      roleNames: user.roleNames ?? []
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setStatusMessage(null);

    try {
      if (isEditing && form.id !== null) {
        if (!canEditUsers) {
          throw new Error("Your current role cannot edit tenant users.");
        }

        const payload: UpdateUserInput = {
          id: form.id,
          userName: form.userName,
          name: form.name,
          surname: form.surname,
          emailAddress: form.emailAddress,
          isActive: form.isActive,
          roleNames: form.roleNames
        };

        await updateUser(payload);
        setStatusMessage(`User "${form.userName}" updated.`);
      } else {
        if (!canCreateUsers) {
          throw new Error("Your current role cannot add tenant users.");
        }

        const payload: CreateUserInput = {
          userName: form.userName,
          name: form.name,
          surname: form.surname,
          emailAddress: form.emailAddress,
          isActive: form.isActive,
          roleNames: form.roleNames,
          password: "123456"
        };

        await createUser(payload);
        setStatusMessage(`User "${form.userName}" created with default password 123456.`);
      }

      resetForm();
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save user.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(user: UserDto) {
    if (!canDeleteUsers) {
      setError("Your current role cannot remove tenant users.");
      return;
    }

    setError(null);
    setStatusMessage(null);

    try {
      await deleteUser(user.id);
      setStatusMessage(`User "${user.userName}" deleted.`);
      if (form.id === user.id) {
        resetForm();
      }
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete user.");
    }
  }

  async function handleActivationToggle(user: UserDto) {
    if (!canToggleActivation) {
      setError("Only tenant administrators can activate or deactivate users.");
      return;
    }

    setError(null);
    setStatusMessage(null);

    try {
      if (user.isActive) {
        await deactivateUser(user.id);
        setStatusMessage(`User "${user.userName}" deactivated.`);
      } else {
        await activateUser(user.id);
        setStatusMessage(`User "${user.userName}" activated.`);
      }

      await loadData();
    } catch (activationError) {
      setError(activationError instanceof Error ? activationError.message : "Unable to change user status.");
    }
  }

  function toggleRole(roleName: string) {
    setForm((current) => ({
      ...current,
      roleNames: current.roleNames.includes(roleName)
        ? current.roleNames.filter((name) => name !== roleName)
        : [...current.roleNames, roleName]
    }));
  }

  function getRoleValue(role: RoleDto) {
    return role.name;
  }

  if (!canViewUsers) {
    return <AccessPanel title="Users" message="Your current tenant role does not allow access to user management." />;
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <h1>Users</h1>
        <button type="button" className="primary-button" onClick={resetForm} disabled={!canCreateUsers && !isEditing}>
          {isEditing ? "Create new user" : "Clear form"}
        </button>
      </div>

      {error ? (
        <p className="auth-status auth-status-error" role="alert">
          {error}
        </p>
      ) : null}

      {statusMessage ? (
        <p className="auth-status auth-status-success" role="status">
          {statusMessage}
        </p>
      ) : null}

      <div className="management-grid">
        <div className="card">
          <div className="card-header">
            <h3>{isEditing ? "Edit user" : "Add user"}</h3>
          </div>
          <div className="card-body">
            {!canAssignRolesFreely ? (
              <p className="auth-status auth-status-neutral">
                Project Leads can add people with the default password <strong>123456</strong> and may only assign Business Analyst, System Architect, or Team Member roles.
              </p>
            ) : (
              <p className="auth-status auth-status-neutral">
                New tenant users start with the default password <strong>123456</strong> and must change it on first login.
              </p>
            )}
            <form className="management-form" onSubmit={handleSubmit}>
              <label className="management-field">
                <span>User name</span>
                <input
                  value={form.userName}
                  onChange={(event) => setForm((current) => ({ ...current, userName: event.target.value }))}
                  required
                />
              </label>

              <label className="management-field">
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>

              <label className="management-field">
                <span>Surname</span>
                <input
                  value={form.surname}
                  onChange={(event) => setForm((current) => ({ ...current, surname: event.target.value }))}
                  required
                />
              </label>

              <label className="management-field">
                <span>Email address</span>
                <input
                  type="email"
                  value={form.emailAddress}
                  onChange={(event) => setForm((current) => ({ ...current, emailAddress: event.target.value }))}
                  required
                />
              </label>

              <label className="management-toggle">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                  disabled={!canToggleActivation}
                />
                <span>{canToggleActivation ? "Active user" : "Activation is managed by tenant administrators"}</span>
              </label>

              <div className="management-field">
                <span>Roles</span>
                <div className="management-checkbox-list">
                  {roles.map((role) => (
                    <label key={role.id} className="management-toggle">
                      <input
                        type="checkbox"
                        checked={form.roleNames.includes(getRoleValue(role))}
                        onChange={() => toggleRole(getRoleValue(role))}
                      />
                      <span>{role.displayName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="management-actions">
                <button type="submit" className="primary-button" disabled={isSaving}>
                  {isSaving ? "Saving..." : isEditing ? "Update user" : "Create user"}
                </button>
                {isEditing ? (
                  <button type="button" className="secondary-button" onClick={resetForm}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header controls">
            <h3>System users</h3>
            <div className="management-toolbar">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search users"
                className="search-input"
              />
              <select value={isActiveFilter} onChange={(event) => setIsActiveFilter(event.target.value as typeof isActiveFilter)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button type="button" className="secondary-button" onClick={() => void loadData()}>
                Refresh
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User name</th>
                  <th>Full name</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6}>Loading users...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No users found.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.userName}</td>
                      <td>{user.fullName || `${user.name} ${user.surname}`}</td>
                      <td>{user.emailAddress}</td>
                      <td>{(user.roleNames ?? []).join(", ") || "-"}</td>
                      <td>{user.isActive ? "Active" : "Inactive"}</td>
                      <td>
                        <div className="action-row">
                          {canEditUsers ? (
                            <button type="button" className="table-action" onClick={() => startEdit(user)}>
                              Edit
                            </button>
                          ) : null}
                          {canToggleActivation ? (
                            <button type="button" className="table-action" onClick={() => void handleActivationToggle(user)}>
                              {user.isActive ? "Deactivate" : "Activate"}
                            </button>
                          ) : null}
                          {canDeleteUsers ? (
                            <button type="button" className="table-action danger" onClick={() => void handleDelete(user)}>
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
