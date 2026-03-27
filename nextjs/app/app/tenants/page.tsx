import { DataTableCard } from "@/app/components/global/data-table-card";
import { tenants } from "@/app/lib/data";

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
          kind: "boolean"
        },
        {
          key: "id",
          label: "Actions",
          width: "200px",
          kind: "actions",
          actions: ["Edit", "Delete"]
        }
      ]}
    />
  );
}
