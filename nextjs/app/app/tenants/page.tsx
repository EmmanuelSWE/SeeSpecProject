import { DataTableCard } from "@/components/data-table-card";
import { tenants } from "@/lib/data";

export default function TenantsPage() {
  return (
    <DataTableCard
      title="Tenants"
      actionLabel="Create"
      rows={tenants}
      searchPlaceholder="Search..."
      enableStatusFilter
      columns={[
        { key: "tenancyName", label: "Tenancy name" },
        { key: "name", label: "Name" },
        {
          key: "isActive",
          label: "Is active",
          render: (row) => <input type="checkbox" checked={Boolean(row.isActive)} readOnly />
        },
        {
          key: "id",
          label: "Actions",
          width: "200px",
          render: () => (
            <div className="action-row">
              <button type="button" className="table-action">Edit</button>
              <button type="button" className="table-action danger">Delete</button>
            </div>
          )
        }
      ]}
    />
  );
}
