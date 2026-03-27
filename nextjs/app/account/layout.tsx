import { AccountShell } from "@/app/components/auth/account-shell";

export default function AccountLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AccountShell>{children}</AccountShell>;
}
