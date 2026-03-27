"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/app/components/global/icons";

type RowValue = string | number | boolean;

type Column<T extends Record<string, RowValue>> = {
  key: keyof T;
  label: string;
  width?: string;
  kind?: "text" | "boolean" | "actions";
  actions?: string[];
};

export function DataTableCard<T extends Record<string, RowValue>>({
  title,
  actionLabel,
  columns,
  rows,
  searchPlaceholder = "Search...",
  enableStatusFilter = false
}: {
  title: string;
  actionLabel: string;
  columns: Column<T>[];
  rows: readonly T[];
  searchPlaceholder?: string;
  enableStatusFilter?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredRows = useMemo(() => {
    const lowered = query.trim().toLowerCase();

    return rows.filter((row) => {
      const statusValue = "isActive" in row ? row.isActive : undefined;
      const matchesQuery =
        lowered.length === 0 || Object.values(row).some((value) => String(value).toLowerCase().includes(lowered));

      if (!matchesQuery) {
        return false;
      }

      if (!enableStatusFilter || typeof statusValue !== "boolean") {
        return true;
      }

      if (statusFilter === "all") {
        return true;
      }

      return statusFilter === "active" ? statusValue : !statusValue;
    });
  }, [enableStatusFilter, query, rows, statusFilter]);

  return (
    <section className="page-section">
      <div className="section-header">
        <h1>{title}</h1>
        <button type="button" className="primary-button">
          <Icon name="plus" />
          <span>{actionLabel}</span>
        </button>
      </div>

      <div className="card">
        <div className="card-header controls">
          <div />
          <div className="search-controls">
            <button type="button" className="search-button">
              <Icon name="search" />
            </button>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="search-input"
            />
            {enableStatusFilter ? (
              <button type="button" className="filter-toggle" onClick={() => setFiltersOpen((value) => !value)}>
                {filtersOpen ? "^" : "v"}
              </button>
            ) : null}
          </div>
        </div>

        {enableStatusFilter && filtersOpen ? (
          <div className="filter-panel">
            <div className="filter-row">
              <span className="filter-label">Is active</span>
              <label>
                <input type="radio" checked={statusFilter === "all"} onChange={() => setStatusFilter("all")} /> All
              </label>
              <label>
                <input
                  type="radio"
                  checked={statusFilter === "active"}
                  onChange={() => setStatusFilter("active")}
                />{" "}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  checked={statusFilter === "inactive"}
                  onChange={() => setStatusFilter("inactive")}
                />{" "}
                No
              </label>
            </div>
            <div className="filter-actions">
              <button type="button" className="primary-button small">
                Search
              </button>
              <button
                type="button"
                className="secondary-button small"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                }}
              >
                Clear
              </button>
            </div>
          </div>
        ) : null}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={String(column.key)} style={column.width ? { width: column.width } : undefined}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={String(column.key)}>
                      {column.kind === "boolean" ? (
                        <input type="checkbox" checked={Boolean(row[column.key])} readOnly />
                      ) : column.kind === "actions" ? (
                        <div className="action-row">
                          {(column.actions ?? []).map((action) => (
                            <button
                              key={action}
                              type="button"
                              className={`table-action ${action.toLowerCase().includes("delete") ? "danger" : ""}`}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      ) : (
                        String(row[column.key])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-footer table-footer">
          <button type="button" className="secondary-button icon-only">
            <Icon name="refresh" />
          </button>
          <p>Total records count: {filteredRows.length}</p>
          <div className="pagination-pill">1</div>
        </div>
      </div>
    </section>
  );
}
