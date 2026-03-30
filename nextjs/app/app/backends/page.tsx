"use client";

import { useEffect, useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { BackendFormFields, type BackendFormState } from "@/app/components/app/backend-form-fields";
import { BackendModal } from "@/app/components/app/backend-modal";
import { BackendsTable } from "@/app/components/app/backends-table";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import { useUserState } from "@/app/lib/providers/userProvider";

const EMPTY_BACKEND_FORM: BackendFormState = {
    name: "",
    framework: "ABP Application",
    runtimeVersion: ".NET 8",
    repositoryUrl: "",
    description: "",
    status: "Draft"
};

export default function BackendsPage() {
    const { session } = useUserState();
    const { backends } = useBackendState();
    const { getBackends, createBackend, updateBackend } = useBackendActions();
    const [selectedBackend, setSelectedBackend] = useState<(typeof backends)[number] | null>(null);
    const [form, setForm] = useState<BackendFormState>(EMPTY_BACKEND_FORM);
    const [mode, setMode] = useState<"create" | "edit" | null>(null);

    useEffect(() => {
        getBackends().catch(() => {});
    }, [getBackends]);

    if (!hasPermission(session, APP_PERMISSIONS.backends)) {
        return <AccessPanel title="Backends" message="Your current role does not allow access to backend workspaces." />;
    }

    function openCreate() {
        setForm(EMPTY_BACKEND_FORM);
        setSelectedBackend(null);
        setMode("create");
    }

    function openEdit(backend: (typeof backends)[number]) {
        setSelectedBackend(backend);
        setForm({
            name: backend.name,
            framework: backend.framework,
            runtimeVersion: backend.runtimeVersion,
            repositoryUrl: backend.repositoryUrl,
            description: backend.description,
            status: backend.status
        });
        setMode("edit");
    }

    function closeModal() {
        setMode(null);
        setSelectedBackend(null);
    }

    async function saveBackend() {
        if (mode === "create") {
            await createBackend(form);
        }

        if (mode === "edit" && selectedBackend) {
            await updateBackend({
                id: selectedBackend.id,
                ...form
            });
        }

        closeModal();
    }

    return (
        <>
            <BackendsTable backends={backends} onCreate={openCreate} onEdit={openEdit} />
            {mode ? (
                <BackendModal title={mode === "create" ? "Create backend" : "Edit backend"} description="Keep the route clean by using a generated backend slug while the internal id stays hidden." onClose={closeModal}>
                    <BackendFormFields value={form} onChange={setForm} />
                    <div className="backend-modal-actions">
                        <button type="button" className="secondary-button" onClick={closeModal}>
                            Cancel
                        </button>
                        <button type="button" className="requirements-action-button" onClick={saveBackend}>
                            {mode === "create" ? "Create backend" : "Save backend"}
                        </button>
                    </div>
                </BackendModal>
            ) : null}
        </>
    );
}
