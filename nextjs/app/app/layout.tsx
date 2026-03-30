import { AppProviders } from "@/app/app/app-providers";
import { DashboardShell } from "@/app/components/app/dashboard-shell";

export default function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppProviders>
      <DashboardShell>{children}</DashboardShell>
    </AppProviders>
  );
}
