"use client";

import { useEffect, useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { BackendFormFields, type BackendFormState } from "@/app/components/app/backend-form-fields";
import { BackendModal } from "@/app/components/app/backend-modal";
import { BackendsTable } from "@/app/components/app/backends-table";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import type { BackendRecord } from "@/app/lib/providers/backendProvider/context";
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
    const { getBackends, createBackend, updateBackend, uploadBackendArchive, deleteBackend } = useBackendActions();
    const [selectedBackend, setSelectedBackend] = useState<BackendRecord | null>(null);
    const [form, setForm] = useState<BackendFormState>(EMPTY_BACKEND_FORM);
    const [mode, setMode] = useState<"create" | "edit" | null>(null);
    const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadFeedback, setUploadFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

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

    function openUpload() {
        setSelectedUploadFile(null);
        setUploadFeedback(null);
        setIsUploadModalOpen(true);
    }

    function closeUploadModal() {
        setIsUploadModalOpen(false);
        setSelectedUploadFile(null);
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

    async function uploadBackend() {
        if (!selectedUploadFile) {
            setUploadFeedback({
                kind: "error",
                message: "Select a backend archive before uploading."
            });
            return;
        }

        setIsUploading(true);
        setUploadFeedback(null);

        try {
            const result = await uploadBackendArchive(selectedUploadFile);
            await getBackends(true);
            setUploadFeedback({
                kind: "success",
                message: `${result.name} uploaded successfully and added to the workspace list.`
            });
            closeUploadModal();
        } catch (error) {
            setUploadFeedback({
                kind: "error",
                message: error instanceof Error ? error.message : "Unable to upload backend archive."
            });
        } finally {
            setIsUploading(false);
        }
    }

    async function removeBackend(backend: BackendRecord) {
        const shouldDelete = window.confirm(`Delete ${backend.name}?`);
        if (!shouldDelete) {
            return;
        }

        try {
            await deleteBackend(backend.id);
            await getBackends(true);
            setUploadFeedback({
                kind: "success",
                message: `${backend.name} was deleted from the workspace list.`
            });
        } catch (error) {
            setUploadFeedback({
                kind: "error",
                message: error instanceof Error ? error.message : "Unable to delete backend."
            });
        }
    }

    return (
        <>
            {uploadFeedback ? (
                <section className="page-section">
                    <div className="card backend-state-card">
                        <div className="card-body backend-blocked-state">
                            <strong>{uploadFeedback.kind === "success" ? "Upload complete." : "Upload failed."}</strong>
                            <p>{uploadFeedback.message}</p>
                        </div>
                    </div>
                </section>
            ) : null}
            <BackendsTable
                backends={backends}
                onCreate={openCreate}
                onEdit={openEdit}
                onUpload={openUpload}
                onDelete={(backend) => { removeBackend(backend).catch(() => {}); }}
            />
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
            {isUploadModalOpen ? (
                <BackendModal
                    title="Upload backend archive"
                    description="Upload a zipped ABP backend archive. The backend is validated on the server, imported, and then reloaded into this workspace list."
                    onClose={closeUploadModal}
                >
                    <div className="backend-form-grid">
                        <label className="backend-form-field">
                            <span>Archive file</span>
                            <input
                                type="file"
                                accept=".zip"
                                onChange={(event) => {
                                    const nextFile = event.target.files?.[0] ?? null;
                                    setSelectedUploadFile(nextFile);
                                }}
                            />
                        </label>
                    </div>
                    {uploadFeedback?.kind === "error" ? <p>{uploadFeedback.message}</p> : null}
                    <div className="backend-modal-actions">
                        <button type="button" className="secondary-button" onClick={closeUploadModal} disabled={isUploading}>
                            Cancel
                        </button>
                        <button type="button" className="requirements-action-button" onClick={uploadBackend} disabled={isUploading || selectedUploadFile === null}>
                            {isUploading ? "Uploading..." : "Upload backend"}
                        </button>
                    </div>
                </BackendModal>
            ) : null}
        </>
    );
}
