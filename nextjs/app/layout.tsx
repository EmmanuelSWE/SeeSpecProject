import type { Metadata } from "next";
import { UserProvider } from "@/app/lib/providers/userProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SeeSpec",
  description: "Next.js frontend matching the Angular SeeSpec project"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
