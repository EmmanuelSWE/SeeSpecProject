"use client";

import { BackendProvider } from "@/app/lib/providers/backendProvider";
import { DiagramElementProvider } from "@/app/lib/providers/diagramElementProvider";
import { SectionItemProvider } from "@/app/lib/providers/sectionItemProvider";
import { SpecProvider } from "@/app/lib/providers/specProvider";
import { SpecSectionProvider } from "@/app/lib/providers/specSectionProvider";
import { UserProvider } from "@/app/lib/providers/userProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <BackendProvider>
        <SpecProvider>
          <SpecSectionProvider>
            <SectionItemProvider>
              <DiagramElementProvider>{children}</DiagramElementProvider>
            </SectionItemProvider>
          </SpecSectionProvider>
        </SpecProvider>
      </BackendProvider>
    </UserProvider>
  );
}
