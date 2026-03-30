"use client";

import { useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { BackendFormFields, type BackendFormState } from "@/app/components/app/backend-form-fields";
import { BackendModal } from "@/app/components/app/backend-modal";
import { BackendsTable } from "@/app/components/app/backends-table";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { createBackendRecord, type BackendRecord, readBackendRecords, writeBackendRecords } from "@/app/lib/mock-backends";
import { useUserState } from "@/app/lib/providers/userProvider";

const EMPTY_BACKEND_FORM: BackendFormState = {
    name: "",
    framework: "ABP Application",
    runtimeVersion: ".NET 8",
    repositoryUrl: "",
    description: "",
    status: "Planned"
};

export default function BackendsPage() {
    const { session } = useUserState();
    const [backends, setBackends] = useState<BackendRecord[]>(() => readBackendRecords());
    const [selectedBackend, setSelectedBackend] = useState<BackendRecord | null>(null);
    const [form, setForm] = useState<BackendFormState>(EMPTY_BACKEND_FORM);
    const [mode, setMode] = useState<"create" | "edit" | null>(null);

    if (!hasPermission(session, APP_PERMISSIONS.backends)) {
        return <AccessPanel title="Backends" message="Your current role does not allow access to backend workspaces." />;
    }

    function openCreate() {
        setForm(EMPTY_BACKEND_FORM);
        setSelectedBackend(null);
        setMode("create");
    }

    function openEdit(backend: BackendRecord) {
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

    function persist(next: BackendRecord[]) {
        writeBackendRecords(next);
        setBackends(next);
    }

    function saveBackend() {
        if (mode === "create") {
            persist([...backends, createBackendRecord(form)]);
        }

        if (mode === "edit" && selectedBackend) {
            persist(
                backends.map((backend) =>
                    backend.id === selectedBackend.id
                        ? {
                              ...backend,
                              ...form
                          }
                        : backend
                )
            );
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
