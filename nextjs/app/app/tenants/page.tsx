"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createTenant,
  deleteTenant,
  getTenants,
  type CreateTenantInput,
  type TenantDto,
  type UpdateTenantInput,
  updateTenant
} from "@/app/lib/utils/services/admin-service";

type TenantFormState = {
  id: number | null;
  tenancyName: string;
  name: string;
  adminEmailAddress: string;
  isActive: boolean;
};

const INITIAL_FORM: TenantFormState = {
  id: null,
  tenancyName: "",
  name: "",
  adminEmailAddress: "",
  isActive: true
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [query, setQuery] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [form, setForm] = useState<TenantFormState>(INITIAL_FORM);

  const isEditing = form.id !== null;

  const filteredTenants = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return tenants.filter((tenant) => {
      if (loweredQuery && !`${tenant.tenancyName} ${tenant.name}`.toLowerCase().includes(loweredQuery)) {
        return false;
      }

      if (isActiveFilter === "all") {
        return true;
      }

      return isActiveFilter === "active" ? tenant.isActive : !tenant.isActive;
    });
  }, [isActiveFilter, query, tenants]);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const tenantResult = await getTenants();
      setTenants(tenantResult.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load tenants.");
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setForm(INITIAL_FORM);
  }

  function startEdit(tenant: TenantDto) {
    setStatusMessage(null);
    setError(null);
    setForm({
      id: tenant.id,
      tenancyName: tenant.tenancyName,
      name: tenant.name,
      adminEmailAddress: "",
      isActive: tenant.isActive
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setStatusMessage(null);

    try {
      if (isEditing && form.id !== null) {
        const payload: UpdateTenantInput = {
          id: form.id,
          tenancyName: form.tenancyName,
          name: form.name,
          isActive: form.isActive
        };

        await updateTenant(payload);
        setStatusMessage(`Tenant "${form.tenancyName}" updated.`);
      } else {
        const payload: CreateTenantInput = {
          tenancyName: form.tenancyName,
          name: form.name,
          adminEmailAddress: form.adminEmailAddress,
          isActive: form.isActive
        };

        await createTenant(payload);
        setStatusMessage(`Tenant "${form.tenancyName}" created.`);
      }

      resetForm();
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save tenant.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(tenant: TenantDto) {
    setError(null);
    setStatusMessage(null);

    try {
      await deleteTenant(tenant.id);
      setStatusMessage(`Tenant "${tenant.tenancyName}" deleted.`);
      if (form.id === tenant.id) {
        resetForm();
      }
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete tenant.");
    }
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <h1>Tenants</h1>
        <button type="button" className="primary-button" onClick={resetForm}>
          {isEditing ? "Create new tenant" : "Clear form"}
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
            <h3>{isEditing ? "Edit tenant" : "Create tenant"}</h3>
          </div>
          <div className="card-body">
            <form className="management-form" onSubmit={handleSubmit}>
              <label className="management-field">
                <span>Tenancy name</span>
                <input
                  value={form.tenancyName}
                  onChange={(event) => setForm((current) => ({ ...current, tenancyName: event.target.value }))}
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

              {!isEditing ? (
                <>
                  <label className="management-field">
                    <span>Admin email address</span>
                    <input
                      type="email"
                      value={form.adminEmailAddress}
                      onChange={(event) => setForm((current) => ({ ...current, adminEmailAddress: event.target.value }))}
                      required
                    />
                  </label>
                </>
              ) : null}

              <label className="management-toggle">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                />
                <span>Active tenant</span>
              </label>

              <div className="management-actions">
                <button type="submit" className="primary-button" disabled={isSaving}>
                  {isSaving ? "Saving..." : isEditing ? "Update tenant" : "Create tenant"}
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
            <h3>Tenant directory</h3>
            <div className="management-toolbar">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tenants"
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
                  <th>Tenancy name</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4}>Loading tenants...</td>
                  </tr>
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No tenants found.</td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant.id}>
                      <td>{tenant.tenancyName}</td>
                      <td>{tenant.name}</td>
                      <td>{tenant.isActive ? "Active" : "Inactive"}</td>
                      <td>
                        <div className="action-row">
                          <button type="button" className="table-action" onClick={() => startEdit(tenant)}>
                            Edit
                          </button>
                          <button type="button" className="table-action danger" onClick={() => void handleDelete(tenant)}>
                            Delete
                          </button>
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
