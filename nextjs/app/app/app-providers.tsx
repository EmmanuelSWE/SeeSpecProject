"use client";

import { BackendProvider } from "@/app/lib/providers/backendProvider";
import { DiagramElementProvider } from "@/app/lib/providers/diagramElementProvider";
import { SpecSectionProvider } from "@/app/lib/providers/specSectionProvider";
import { UserProvider } from "@/app/lib/providers/userProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <BackendProvider>
        <SpecSectionProvider>
          <DiagramElementProvider>{children}</DiagramElementProvider>
        </SpecSectionProvider>
      </BackendProvider>
    </UserProvider>
  );
}
