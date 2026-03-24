import { DataTableCard } from "@/components/data-table-card";
import { roles } from "@/lib/data";

export default function RolesPage() {
  return (
    <DataTableCard
      title="Roles"
      actionLabel="Create"
      rows={roles}
      searchPlaceholder="Search..."
      columns={[
        { key: "name", label: "Role name" },
        { key: "displayName", label: "Display name" },
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
