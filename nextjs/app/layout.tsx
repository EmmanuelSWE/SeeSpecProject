import type { Metadata } from "next";
import { AppProviders } from "@/app/app/app-providers";
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
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
