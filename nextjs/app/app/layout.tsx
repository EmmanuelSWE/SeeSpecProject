import { DashboardShell } from "@/app/components/app/dashboard-shell";

export default function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardShell>{children}</DashboardShell>;
}
