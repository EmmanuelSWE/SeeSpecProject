"use client";

import { BackendProvider } from "@/app/lib/providers/backendProvider";
import { DiagramElementProvider } from "@/app/lib/providers/diagramElementProvider";
import { SpecProvider } from "@/app/lib/providers/specProvider";
import { SpecSectionProvider } from "@/app/lib/providers/specSectionProvider";
import { UserProvider } from "@/app/lib/providers/userProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <BackendProvider>
        <SpecProvider>
          <SpecSectionProvider>
            <DiagramElementProvider>{children}</DiagramElementProvider>
          </SpecSectionProvider>
        </SpecProvider>
      </BackendProvider>
    </UserProvider>
  );
}
