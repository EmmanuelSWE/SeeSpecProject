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
          render: (row) => <input type="checkbox" checked={Boolean(row.isActive)} readOnly />
        },
        {
          key: "id",
          label: "Actions",
          width: "310px",
          render: () => (
            <div className="action-row">
              <button type="button" className="table-action">Edit</button>
              <button type="button" className="table-action danger">Delete</button>
              <button type="button" className="table-action">Reset password</button>
            </div>
          )
        }
      ]}
    />
  );
}
