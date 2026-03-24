import { DataTableCard } from "@/components/data-table-card";
import { users } from "@/lib/data";

export default function UsersPage() {
  return (
    <DataTableCard
      title="Users"
      actionLabel="Create"
      rows={users}
      searchPlaceholder="Search..."
      enableStatusFilter
      columns={[
        { key: "userName", label: "User name" },
        { key: "fullName", label: "Full name" },
        { key: "emailAddress", label: "Email address" },
        {
          key: "isActive",
          label: "Is active",
          kind: "boolean"
        },
        {
          key: "id",
          label: "Actions",
          width: "310px",
          kind: "actions",
          actions: ["Edit", "Delete", "Reset password"]
        }
      ]}
    />
  );
}
