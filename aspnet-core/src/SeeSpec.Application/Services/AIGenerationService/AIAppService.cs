using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Runtime.Session;
using Abp.UI;
using Newtonsoft.Json;
using SeeSpec.Domains.CodingManagement;
using SeeSpec.Domains.SpecManagement;
using SeeSpec.Services.BackendService;
using SeeSpec.Services.BackendService.DTO;
using SeeSpec.Services.AIGenerationService.DTO;
using SeeSpec.Services.SpecService;
using SeeSpec.Services.SpecService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    [AbpAuthorize]
    public class AIAppService : SeeSpecAppServiceBase, IAIAppService
    {
        private readonly IAIGenerationService _aiGenerationService;
        private readonly IAISpecGenerationService _aiSpecGenerationService;
        private readonly IGenerationCodeWriterService _generationCodeWriterService;
        private readonly IBackendImportService _backendImportService;
        private readonly IRepository<GenerationSnapshot, Guid> _generationSnapshotRepository;
        private readonly IRepository<Spec, Guid> _specRepository;
        private readonly ISpecAppService _specAppService;

        public AIAppService(
            IAIGenerationService aiGenerationService,
            IAISpecGenerationService aiSpecGenerationService,
            IGenerationCodeWriterService generationCodeWriterService,
            IBackendImportService backendImportService,
            IRepository<GenerationSnapshot, Guid> generationSnapshotRepository,
            IRepository<Spec, Guid> specRepository,
            ISpecAppService specAppService)
        {
            _aiGenerationService = aiGenerationService;
            _aiSpecGenerationService = aiSpecGenerationService;
            _generationCodeWriterService = generationCodeWriterService;
            _backendImportService = backendImportService;
            _generationSnapshotRepository = generationSnapshotRepository;
            _specRepository = specRepository;
            _specAppService = specAppService;
        }

        // AI generation endpoints belong to the app-service layer so the public backend contract
        // follows the same ABP service architecture as the rest of the application.
        public Task<GenerateAiResponseDto> GenerateAsync(GenerateAiRequestDto input)
        {
            return _aiGenerationService.GenerateAsync(input, default);
        }

        public async Task<GenerateSpecCodeResponseDto> GenerateFromSpecAsync(GenerateSpecCodeRequestDto input)
        {
            Spec spec = await _specRepository.GetAsync(input.SpecId);
            GenerateSpecCodeResponseDto response = await _aiSpecGenerationService.GenerateFromSpecAsync(input, default);
            AssembledSpecDto assembledSpec = await _specAppService.AssembleAsync(new EntityDto<Guid>(input.SpecId));

            await _generationCodeWriterService.ClearWorkspaceAsync(spec.BackendId, AbpSession.UserId, default);

            List<PlannedArtifact> plannedArtifacts = await PlanArtifactsAsync(spec.BackendId, assembledSpec, input);
            foreach (PlannedArtifact plannedArtifact in plannedArtifacts)
            {
                response.Artifacts.Add(await _generationCodeWriterService.PrepareArtifactAsync(
                    new GenerationCodeWriterInputDto
                    {
                        BackendId = spec.BackendId,
                        SpecId = spec.Id,
                        SessionUserId = AbpSession.UserId,
                        SpecTitle = plannedArtifact.SourceTitle,
                        ArtifactType = plannedArtifact.ArtifactType,
                        TargetFolderPath = plannedArtifact.TargetFolder.FolderPath,
                        ProjectPath = plannedArtifact.TargetFolder.ProjectPath,
                        ProjectName = plannedArtifact.TargetFolder.ProjectName,
                        GeneratedContent = response.OutputText,
                        ProviderModel = response.Model,
                        Prompt = response.Prompt,
                        GeneratedAtUtc = response.Timestamp.ToUniversalTime(),
                        MalformedRegionDecision = input.MalformedRegionDecision,
                        SourceSectionId = plannedArtifact.SourceSection.Id,
                        DependencySectionIds = plannedArtifact.SourceSection.DependencySectionIds?.ToList() ?? new List<Guid>()
                    },
                    default));
            }

            response.WorkspaceKey = response.Artifacts.FirstOrDefault()?.WorkspaceKey;
            response.GenerationMode = input.GenerationMode;
            response.IsPreviewOnly = true;
            response.HasAppliedArtifacts = false;

            bool requiresMalformedRegionDecision = response.Artifacts.Exists(artifact => artifact.RequiresMalformedRegionDecision);
            if (requiresMalformedRegionDecision)
            {
                return response;
            }

            string workspaceRoot = System.IO.Path.Combine(
                System.IO.Path.GetTempPath(),
                "SeeSpecGenerationWorkspace",
                AbpSession.UserId?.ToString() ?? "anonymous",
                spec.BackendId.ToString("N"));
            await GenerationCodeWriterService.PersistWorkspaceArtifactsAsync(workspaceRoot, response.Artifacts, default);

            // Persist immutable generation snapshots in the standard coding-management model so
            // traceability lives in the backend service flow instead of controller code paths.
            await _generationSnapshotRepository.InsertAsync(new GenerationSnapshot
            {
                BackendId = spec.BackendId,
                SpecId = spec.Id,
                TriggeredByUserId = AbpSession.GetUserId(),
                Mode = input.GenerationMode == GenerationRunMode.FullBackendGeneration ? GenerationMode.Full : GenerationMode.Incremental,
                Status = GenerationStatus.Succeeded,
                Summary = input.GenerationMode == GenerationRunMode.FullBackendGeneration
                    ? "Dry-run full backend generation preview"
                    : "Dry-run single artifact family preview",
                AffectedSectionIdsJson = JsonConvert.SerializeObject(response.Artifacts.SelectMany(artifact => artifact.SourceMetadata?.SourceSectionIds ?? new List<Guid>()).Distinct()),
                PromptSent = response.Prompt,
                ModelName = response.Model,
                ProviderName = "Groq",
                OutputText = response.OutputText,
                TargetFilePathsJson = JsonConvert.SerializeObject(response.Artifacts.ConvertAll(artifact => artifact.TargetFilePath)),
                GeneratedArtifactsJson = JsonConvert.SerializeObject(response.Artifacts)
            });
            await CurrentUnitOfWork.SaveChangesAsync();

            return response;
        }

        public async Task<ApplyGeneratedCodeResponseDto> ApplyGeneratedCodeAsync(ApplyGeneratedCodeRequestDto input)
        {
            ApplyGeneratedCodeResponseDto response = await _generationCodeWriterService.ApplyArtifactsAsync(input, AbpSession.UserId, default);
            if (response.AnyArtifactsApplied)
            {
                Spec spec = await _specRepository.GetAsync(input.SpecId);
                await _generationSnapshotRepository.InsertAsync(new GenerationSnapshot
                {
                    BackendId = spec.BackendId,
                    SpecId = spec.Id,
                    TriggeredByUserId = AbpSession.GetUserId(),
                    Mode = GenerationMode.Incremental,
                    Status = response.AllArtifactsApplied ? GenerationStatus.Succeeded : GenerationStatus.Running,
                    Summary = response.AllArtifactsApplied
                        ? "Generated code applied to backend"
                        : "Generated code partially applied; overwrite decision pending",
                    AffectedSectionIdsJson = JsonConvert.SerializeObject(response.Artifacts.SelectMany(artifact => artifact.SourceMetadata?.SourceSectionIds ?? new List<Guid>()).Distinct()),
                    PromptSent = string.Empty,
                    ModelName = AIGenerationOptions.DefaultModel,
                    ProviderName = "Groq",
                    OutputText = JsonConvert.SerializeObject(response.Artifacts.Select(artifact => new
                    {
                        artifact.TargetFilePath,
                        artifact.ApplyStatus
                    })),
                    TargetFilePathsJson = JsonConvert.SerializeObject(response.Artifacts.Select(artifact => artifact.TargetFilePath)),
                    GeneratedArtifactsJson = JsonConvert.SerializeObject(response.Artifacts)
                });
                await CurrentUnitOfWork.SaveChangesAsync();
            }

            return response;
        }

        public Task CleanupGenerationWorkspaceAsync(CleanupGenerationWorkspaceRequestDto input)
        {
            if (input == null || input.BackendId == Guid.Empty)
            {
                throw new UserFriendlyException("A backend identity is required for workspace cleanup.");
            }

            return _generationCodeWriterService.ClearWorkspaceAsync(input.BackendId, AbpSession.UserId, default);
        }

        private async Task<List<PlannedArtifact>> PlanArtifactsAsync(
            Guid backendId,
            AssembledSpecDto assembledSpec,
            GenerateSpecCodeRequestDto input)
        {
            List<PlannedArtifact> plans = new List<PlannedArtifact>();
            foreach (AssembledSpecSectionDto section in assembledSpec.Sections ?? Array.Empty<AssembledSpecSectionDto>())
            {
                IEnumerable<GenerationArtifactType> sectionArtifactTypes = ResolveArtifactTypes(section);
                foreach (GenerationArtifactType artifactType in sectionArtifactTypes)
                {
                    if (input.GenerationMode == GenerationRunMode.SingleArtifactFamily && artifactType != input.ArtifactType)
                    {
                        continue;
                    }

                    AllowedGenerationFolderDto targetFolder = await ResolveTargetFolderAsync(backendId, artifactType, input);
                    plans.Add(new PlannedArtifact
                    {
                        ArtifactType = artifactType,
                        SourceSection = section,
                        SourceTitle = section.Title,
                        TargetFolder = targetFolder
                    });
                }
            }

            if (plans.Count == 0)
            {
                throw new UserFriendlyException("No generation artifacts could be planned for the selected backend sections.");
            }

            return plans;
        }

        private async Task<AllowedGenerationFolderDto> ResolveTargetFolderAsync(
            Guid backendId,
            GenerationArtifactType artifactType,
            GenerateSpecCodeRequestDto input)
        {
            if (input.GenerationMode == GenerationRunMode.SingleArtifactFamily)
            {
                return await _backendImportService.ValidateGenerationFolderAsync(
                    new ValidateGenerationFolderInputDto
                    {
                        BackendId = backendId,
                        ArtifactType = artifactType,
                        FolderPath = input.TargetFolderPath
                    },
                    default);
            }

            List<AllowedGenerationFolderDto> folders = await _backendImportService.GetAllowedGenerationFoldersAsync(
                new GetAllowedGenerationFoldersInputDto
                {
                    BackendId = backendId,
                    ArtifactType = artifactType
                },
                default);

            AllowedGenerationFolderDto folder = folders.FirstOrDefault();
            if (folder == null)
            {
                throw new UserFriendlyException(string.Format("No approved target folder exists for artifact type {0}.", artifactType));
            }

            return folder;
        }

        private static IEnumerable<GenerationArtifactType> ResolveArtifactTypes(AssembledSpecSectionDto section)
        {
            if (section == null)
            {
                yield break;
            }

            if (section.DiagramType == DiagramType.DomainModel)
            {
                yield return GenerationArtifactType.DomainEntity;
                yield return GenerationArtifactType.Dto;
                yield return GenerationArtifactType.Repository;
                yield break;
            }

            if (section.DiagramType == DiagramType.UseCase)
            {
                yield return GenerationArtifactType.AppServiceInterface;
                yield return GenerationArtifactType.AppServiceClass;
                yield return GenerationArtifactType.PermissionSeed;
            }
        }

        private sealed class PlannedArtifact
        {
            public GenerationArtifactType ArtifactType { get; set; }

            public AssembledSpecSectionDto SourceSection { get; set; }

            public string SourceTitle { get; set; }

            public AllowedGenerationFolderDto TargetFolder { get; set; }
        }
    }
}
