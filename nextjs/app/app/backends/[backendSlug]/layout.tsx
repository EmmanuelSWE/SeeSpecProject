import type { ReactNode } from "react";
import { BackendGenerationSessionGuard } from "@/app/components/app/backend-generation-session-guard";

export default function BackendScopedLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <BackendGenerationSessionGuard />
            {children}
        </>
    );
}
