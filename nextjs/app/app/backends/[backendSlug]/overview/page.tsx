"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessPanel } from "@/app/components/app/access-panel";
import { BackendOverviewWorkspace } from "@/app/components/app/backend-overview-workspace";
import { APP_PERMISSIONS, hasPermission } from "@/app/lib/auth/permissions";
import { withAuth, type WithAuthProps } from "@/app/lib/auth/with-auth";
import { useBackendActions, useBackendState } from "@/app/lib/providers/backendProvider";
import type { AllowedGenerationFolder, GenerationArtifactType } from "@/app/lib/providers/backendProvider/context";
import type { GenerationRunMode } from "@/app/lib/providers/specProvider/context";
import { useSpecActions, useSpecState } from "@/app/lib/providers/specProvider";
import { useSpecSectionActions, useSpecSectionState } from "@/app/lib/providers/specSectionProvider";
import {
    createSectionItem,
    updateSectionItem
} from "@/app/lib/utils/services/section-item-service";
import { hasOverviewChanged, selectOverviewSection } from "@/app/lib/workflow/overview-gate";

const WORKFLOW_ROLES = ["Host Admin", "Tenant Admin", "Business Analyst", "System Architect", "Project Lead"] as const;

function BackendOverviewPage({ session }: WithAuthProps) {
    const params = useParams<{ backendSlug: string }>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { backend } = useBackendState();
    const { generatedPreview, isGeneratingPreview, previewErrorMessage, isApplyingGeneratedCode, applyGeneratedCodeErrorMessage } = useSpecState();
    const { sections } = useSpecSectionState();
    const { getAllowedGenerationFolders, getBackendBySlug, getWorkflowReadiness, updateBackend } = useBackendActions();
    const { applyGeneratedCode, clearGeneratedPreview, generateSpecCode, getSpecByBackend } = useSpecActions();
    const { getSectionsByBackend, createSection, updateSection } = useSpecSectionActions();
    const [hasResolvedBackend, setHasResolvedBackend] = useState(false);
    const [hasResolvedSections, setHasResolvedSections] = useState(false);
    const [pageErrorMessage, setPageErrorMessage] = useState<string | null>(null);
    const [generationRunMode, setGenerationRunMode] = useState<GenerationRunMode>(1);
    const [generationArtifactType, setGenerationArtifactType] = useState<GenerationArtifactType>(2);
    const [generationFolderOptions, setGenerationFolderOptions] = useState<AllowedGenerationFolder[]>([]);
    const [selectedGenerationFolderPath, setSelectedGenerationFolderPath] = useState<string>("");
    const [isLoadingGenerationFolders, setIsLoadingGenerationFolders] = useState(false);
    const [generationFolderErrorMessage, setGenerationFolderErrorMessage] = useState<string | null>(null);
    const [workflowReadiness, setWorkflowReadiness] = useState<Awaited<ReturnType<typeof getWorkflowReadiness>> | null>(null);
    const [isLoadingWorkflowReadiness, setIsLoadingWorkflowReadiness] = useState(false);
    const [shouldPromptOverviewCreation, setShouldPromptOverviewCreation] = useState(false);
    const overviewSection = selectOverviewSection(sections, backend?.slug ?? null);
    const roleSections = sections.filter((item) => item.type === "role");

    useEffect(() => {
        let isActive = true;

        getBackendBySlug(params.backendSlug)
            .catch((error) => {
                if (!isActive) {
                    return;
                }

                setPageErrorMessage(error instanceof Error ? error.message : "Unable to load this backend.");
            })
            .finally(() => {
                if (isActive) {
                    setHasResolvedBackend(true);
                }
            });

        return () => {
            isActive = false;
        };
    }, [getBackendBySlug, params.backendSlug]);

    useEffect(() => {
        let isActive = true;

        if (backend) {
            getSectionsByBackend(backend.id)
                .catch((error) => {
                    if (!isActive) {
                        return;
                    }

                    setPageErrorMessage(error instanceof Error ? error.message : "Unable to load backend sections.");
                })
                .finally(() => {
                    if (isActive) {
                        setHasResolvedSections(true);
                    }
                });
            return () => {
                isActive = false;
            };
        }
        return () => {
            isActive = false;
        };
    }, [backend, getSectionsByBackend]);

    useEffect(() => {
        let isActive = true;

        if (!backend) {
            setWorkflowReadiness(null);
            return () => {
                isActive = false;
            };
        }

        void (async () => {
            setIsLoadingWorkflowReadiness(true);

            try {
                const readiness = await getWorkflowReadiness(backend.id);
                if (!isActive) {
                    return;
                }

                setWorkflowReadiness(readiness);
            } catch (error) {
                if (!isActive) {
                    return;
                }

                setPageErrorMessage(error instanceof Error ? error.message : "Unable to load backend workflow readiness.");
            } finally {
                if (isActive) {
                    setIsLoadingWorkflowReadiness(false);
                }
            }
        })();

        return () => {
            isActive = false;
        };
    }, [backend, getWorkflowReadiness, sections.length]);

    useEffect(() => {
        if (!backend || !hasResolvedSections || searchParams.get("prompt") !== "create-overview") {
            return;
        }

        if (!overviewSection) {
            setShouldPromptOverviewCreation(true);
        }

        router.replace(`/app/backends/${backend.slug}/overview`);
    }, [backend, hasResolvedSections, overviewSection, router, searchParams]);

    useEffect(() => {
        let isActive = true;

        if (!backend || generationRunMode === 2) {
            setGenerationFolderOptions([]);
            setSelectedGenerationFolderPath("");
            return () => {
                isActive = false;
            };
        }

        void (async () => {
            if (!isActive) {
                return;
            }

            setIsLoadingGenerationFolders(true);
            setGenerationFolderErrorMessage(null);

            try {
                const folders = await getAllowedGenerationFolders(backend.id, generationArtifactType);
                if (!isActive) {
                    return;
                }

                setGenerationFolderOptions(folders);
                setSelectedGenerationFolderPath((currentSelection) => {
                    if (currentSelection && folders.some((folder) => folder.folderPath === currentSelection)) {
                        return currentSelection;
                    }

                    return folders[0]?.folderPath ?? "";
                });
            } catch (error) {
                if (!isActive) {
                    return;
                }

                setGenerationFolderOptions([]);
                setSelectedGenerationFolderPath("");
                setGenerationFolderErrorMessage(
                    error instanceof Error ? error.message : "Unable to load approved generation folders."
                );
            } finally {
                if (isActive) {
                    setIsLoadingGenerationFolders(false);
                }
            }
        })();

        return () => {
            isActive = false;
        };
    }, [backend, generationArtifactType, generationRunMode, getAllowedGenerationFolders]);

    const isPageLoading = !hasResolvedBackend || (backend !== null && (!hasResolvedSections || isLoadingWorkflowReadiness));

    if (!hasPermission(session, APP_PERMISSIONS.backends)) {
        return <AccessPanel title="Backends" message="Your current role does not allow access to backend workspaces." />;
    }

    if (pageErrorMessage) {
        return (
            <section className="page-section">
                <div className="card backend-state-card">
                    <div className="card-body backend-blocked-state">
                        <strong>Backend workspace failed to load.</strong>
                        <p>{pageErrorMessage}</p>
                    </div>
                </div>
            </section>
        );
    }

    if (isPageLoading) {
        return (
            <section className="page-section">
                <div className="card backend-state-card">
                    <div className="card-body backend-blocked-state">
                        <strong>Loading backend workspace...</strong>
                        <p>Fetching the overview, sections, and current workspace state for this backend.</p>
                    </div>
                </div>
            </section>
        );
    }

    if (backend === null) {
        return (
            <section className="page-section">
                <div className="card backend-state-card">
                    <div className="card-body backend-blocked-state">
                        <strong>Backend not found.</strong>
                        <p>Select an available backend from the backends workspace.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <BackendOverviewWorkspace
            backend={backend}
            overviewSection={overviewSection}
            roleSections={roleSections}
            canManageRoles={true}
            generatedPreview={generatedPreview}
            isGeneratingPreview={isGeneratingPreview}
            previewErrorMessage={previewErrorMessage}
            applyGeneratedCodeErrorMessage={applyGeneratedCodeErrorMessage}
            isApplyingGeneratedCode={isApplyingGeneratedCode}
            generationRunMode={generationRunMode}
            generationArtifactType={generationArtifactType}
            generationFolderOptions={generationFolderOptions}
            selectedGenerationFolderPath={selectedGenerationFolderPath}
            isLoadingGenerationFolders={isLoadingGenerationFolders}
            generationFolderErrorMessage={generationFolderErrorMessage}
            onSelectGenerationRunMode={setGenerationRunMode}
            onSelectGenerationArtifactType={setGenerationArtifactType}
            onSelectGenerationFolder={setSelectedGenerationFolderPath}
            onGeneratePreview={async () => {
                const spec = await getSpecByBackend(backend.id);
                if (!spec) {
                    throw new Error("No spec is available for this backend yet.");
                }

                if (generationRunMode === 1 && !selectedGenerationFolderPath) {
                    throw new Error("Choose one of the approved target folders before generating a preview.");
                }

                await generateSpecCode({
                    specId: spec.id,
                    generationMode: generationRunMode,
                    artifactType: generationArtifactType,
                    targetFolderPath: generationRunMode === 1 ? selectedGenerationFolderPath : "",
                    malformedRegionDecision: 0
                });
            }}
            onResolveMalformedRegions={async (decision) => {
                const spec = await getSpecByBackend(backend.id);
                if (!spec) {
                    throw new Error("No spec is available for this backend yet.");
                }

                if (generationRunMode === 1 && !selectedGenerationFolderPath) {
                    throw new Error("Choose one of the approved target folders before generating a preview.");
                }

                await generateSpecCode({
                    specId: spec.id,
                    generationMode: generationRunMode,
                    artifactType: generationArtifactType,
                    targetFolderPath: generationRunMode === 1 ? selectedGenerationFolderPath : "",
                    malformedRegionDecision: decision
                });
            }}
            onApplyGeneratedCode={async (confirmOverwriteExisting) => {
                const spec = await getSpecByBackend(backend.id);
                if (!spec) {
                    throw new Error("No spec is available for this backend yet.");
                }

                if (!generatedPreview?.workspaceKey) {
                    throw new Error("Generate a preview before applying code.");
                }

                await applyGeneratedCode({
                    specId: spec.id,
                    workspaceKey: generatedPreview.workspaceKey,
                    confirmApply: true,
                    confirmOverwriteExisting
                });
            }}
            onClearPreview={clearGeneratedPreview}
            workflowReadiness={workflowReadiness}
            shouldPromptOverviewCreation={shouldPromptOverviewCreation}
            onOverviewPromptConsumed={() => setShouldPromptOverviewCreation(false)}
            onSaveBackend={async (payload) => {
                await updateBackend({ id: backend.id, ...payload });
                setWorkflowReadiness(await getWorkflowReadiness(backend.id));
            }}
            onSaveOverview={async (payload) => {
                // Overview is a singleton per backend, so edit must always bind to the existing section identity.
                const existingOverview = selectOverviewSection(sections, backend.slug);
                const nextOverviewContent: [string, string, string] = [payload.summary, payload.scope, payload.goals];

                if (existingOverview) {
                    if (!hasOverviewChanged(existingOverview, nextOverviewContent)) {
                        return;
                    }

                    await updateSection({
                        id: existingOverview.id,
                        title: `${backend.name} Overview`,
                        summary: payload.summary,
                        content: nextOverviewContent,
                        isAccepted: false
                    });
                    await getSectionsByBackend(backend.id);
                    setWorkflowReadiness(await getWorkflowReadiness(backend.id));
                    return;
                }

                await createSection({
                    backendId: backend.id,
                    type: "overview",
                    title: `${backend.name} Overview`,
                    summary: payload.summary,
                    content: nextOverviewContent,
                    isAccepted: false,
                    tags: ["Overview", backend.name]
                });
                await getSectionsByBackend(backend.id);
                setWorkflowReadiness(await getWorkflowReadiness(backend.id));
            }}
            onAcceptOverview={async () => {
                const existingOverview = selectOverviewSection(sections, backend.slug);

                if (!existingOverview) {
                    return;
                }

                await updateSection({
                    id: existingOverview.id,
                    title: existingOverview.title,
                    summary: existingOverview.summary,
                    content: existingOverview.content,
                    isAccepted: true
                });
                await getSectionsByBackend(backend.id);
                setWorkflowReadiness(await getWorkflowReadiness(backend.id));
            }}
            onSaveRole={async (role) => {
                // Roles are stored in the spec model as Shared SpecSections, and the editable role details live in SectionItems.
                const createdRoleSection = await createSection({
                    backendId: backend.id,
                    type: "role",
                    title: role.roleName,
                    summary: role.note || role.assignedTo || role.roleName,
                    content: [role.note || role.assignedTo || role.roleName],
                    tags: ["Role", role.roleName, backend.name]
                });

                const existingItems = createdRoleSection.sectionItems;
                const roleItemPayloads = [
                    { label: "assignedTo", content: role.assignedTo, position: 1 },
                    { label: "emailAddress", content: role.emailAddress, position: 2 },
                    { label: "note", content: role.note, position: 3 }
                ] as const;

                await Promise.all(
                    roleItemPayloads.map(async (item) => {
                        const existingItem = existingItems.find((entry) => entry.label === item.label) ?? null;
                        if (existingItem) {
                            await updateSectionItem({
                                id: existingItem.id,
                                content: item.content,
                                position: item.position
                            });
                            return;
                        }

                        await createSectionItem({
                            specSectionId: createdRoleSection.id,
                            label: item.label,
                            content: item.content,
                            position: item.position
                        });
                    })
                );
                await getSectionsByBackend(backend.id);
                setWorkflowReadiness(await getWorkflowReadiness(backend.id));
            }}
        />
    );
}

export default withAuth(BackendOverviewPage, { roles: [...WORKFLOW_ROLES] });
