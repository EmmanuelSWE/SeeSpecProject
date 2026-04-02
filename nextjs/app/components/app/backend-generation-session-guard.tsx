"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useBackendActions } from "@/app/lib/providers/backendProvider";
import { useSpecActions } from "@/app/lib/providers/specProvider";

const TRACKER_STORAGE_KEY = "seespec-active-backend";
const TRACKER_COOKIE_KEY = "seespec-active-backend";

type BackendTracker = {
    backendId: string;
    backendSlug: string;
};

function readTracker(): BackendTracker | null {
    if (typeof window === "undefined") {
        return null;
    }

    const raw = window.localStorage.getItem(TRACKER_STORAGE_KEY);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as BackendTracker;
    } catch {
        return null;
    }
}

function writeTracker(tracker: BackendTracker): void {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(tracker));
    document.cookie = `${TRACKER_COOKIE_KEY}=${encodeURIComponent(JSON.stringify(tracker))}; path=/`;
}

export function BackendGenerationSessionGuard() {
    const params = useParams<{ backendSlug: string }>();
    const backendSlug = params?.backendSlug ?? null;
    const { getBackendBySlug } = useBackendActions();
    const { cleanupGenerationWorkspace } = useSpecActions();

    useEffect(() => {
        let isActive = true;

        void (async () => {
            if (!backendSlug) {
                return;
            }

            const nextBackend = await getBackendBySlug(backendSlug);
            if (!isActive || !nextBackend) {
                return;
            }

            const previousTracker = readTracker();
            if (previousTracker && previousTracker.backendId !== nextBackend.id) {
                await cleanupGenerationWorkspace(previousTracker.backendId);
            }

            writeTracker({
                backendId: nextBackend.id,
                backendSlug: nextBackend.slug
            });
        })();

        return () => {
            isActive = false;
        };
    }, [backendSlug, cleanupGenerationWorkspace, getBackendBySlug]);

    return null;
}
