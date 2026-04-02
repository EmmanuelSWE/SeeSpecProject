using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Abp.Dependency;
using Abp.UI;
using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public class GenerationCodeWriterService : IGenerationCodeWriterService, ITransientDependency
    {
        private const string WorkspaceRootFolderName = "SeeSpecGenerationWorkspace";

        private readonly IProtectedRegionStandardService _protectedRegionStandardService;
        private readonly IProtectedRegionMergeService _protectedRegionMergeService;
        private readonly IGenerationStandardsEnforcementService _generationStandardsEnforcementService;
        private readonly IGenerationArtifactSkeletonService _generationArtifactSkeletonService;
        private readonly IArtifactComparisonService _artifactComparisonService;

        public GenerationCodeWriterService(
            IProtectedRegionStandardService protectedRegionStandardService,
            IProtectedRegionMergeService protectedRegionMergeService,
            IGenerationStandardsEnforcementService generationStandardsEnforcementService,
            IGenerationArtifactSkeletonService generationArtifactSkeletonService,
            IArtifactComparisonService artifactComparisonService)
        {
            _protectedRegionStandardService = protectedRegionStandardService;
            _protectedRegionMergeService = protectedRegionMergeService;
            _generationStandardsEnforcementService = generationStandardsEnforcementService;
            _generationArtifactSkeletonService = generationArtifactSkeletonService;
            _artifactComparisonService = artifactComparisonService;
        }

        public async Task<GenerationArtifactDto> PrepareArtifactAsync(
            GenerationCodeWriterInputDto input,
            CancellationToken cancellationToken)
        {
            ValidateInput(input);

            string targetFilePath = BuildTargetFilePath(input.TargetFolderPath, input.SpecTitle, input.ArtifactType);
            var protectedRegions = _protectedRegionStandardService.GetRegions(input.ArtifactType, targetFilePath);
            bool targetExists = File.Exists(targetFilePath);
            bool protectedRegionsDetected = false;
            string preparedContent = _generationArtifactSkeletonService.BuildSkeleton(
                input.ArtifactType,
                targetFilePath,
                input.ProjectPath,
                input.ProjectName,
                protectedRegions);

            if (targetExists)
            {
                string existingContent = await File.ReadAllTextAsync(targetFilePath, cancellationToken);
                ProtectedRegionExtractionResultDto extractionResult = _protectedRegionMergeService.Extract(
                    existingContent,
                    targetFilePath,
                    protectedRegions);
                protectedRegionsDetected = extractionResult.HasProtectedRegions;

                if (extractionResult.HasMalformedRegions && input.MalformedRegionDecision == MalformedProtectedRegionDecision.Unspecified)
                {
                    return new GenerationArtifactDto
                    {
                        TargetFilePath = targetFilePath,
                        ArtifactType = input.ArtifactType,
                        GeneratedContent = preparedContent,
                        TargetExists = true,
                        ProtectedRegionsDetected = protectedRegionsDetected,
                        IsGeneratorOwnedFile = true,
                        RequiresMalformedRegionDecision = true,
                        AppliedMalformedRegionDecision = MalformedProtectedRegionDecision.Unspecified,
                        MalformedRegionWarning = new MalformedProtectedRegionWarningDto
                        {
                            TargetFilePath = targetFilePath,
                            RequiresUserDecision = true,
                            Message = "Protected regions in the existing file are malformed. Accept repair to continue with best-effort reinjection, or decline repair to preserve recoverable manual code at the bottom of the generated file.",
                            AffectedRegionNames = extractionResult.MalformedRegions.Select(item => item.Name).Distinct().ToList()
                        },
                        ProtectedRegions = protectedRegions.ToList(),
                        SourceMetadata = new GenerationArtifactSourceMetadataDto
                        {
                            SpecId = input.SpecId,
                            ProviderModel = input.ProviderModel,
                            GeneratedAtUtc = input.GeneratedAtUtc,
                            PromptHash = ComputePromptHash(input.Prompt),
                            SourceKind = "spec-dry-run-preview",
                            SourceSectionIds = new List<Guid> { input.SourceSectionId },
                            DependencySectionIds = input.DependencySectionIds?.ToList() ?? new List<Guid>()
                        }
                    };
                }

                ProtectedRegionMergeResultDto mergeResult = _protectedRegionMergeService.Reinject(
                    preparedContent,
                    targetFilePath,
                    protectedRegions,
                    extractionResult);

                if (extractionResult.HasMalformedRegions)
                {
                    if (input.MalformedRegionDecision == MalformedProtectedRegionDecision.PreserveAtFileEnd)
                    {
                        mergeResult = _protectedRegionMergeService.AppendConflictedManualCode(
                            mergeResult.MergedContent,
                            targetFilePath,
                            extractionResult);
                    }

                    if (mergeResult.HasConsistencyErrors && input.MalformedRegionDecision == MalformedProtectedRegionDecision.Unspecified)
                    {
                        throw new UserFriendlyException("Malformed protected-region preservation requires an explicit repair decision.");
                    }
                }

                // Protected-region preservation is deterministic by target path identity. If the
                // generated content does not yet expose matching markers, later malformed-region
                // handling can decide how to recover, but the preview still stages the exact file.
                preparedContent = mergeResult.MergedContent;
            }

            GenerationStandardsValidationResultDto validationResult = _generationStandardsEnforcementService.Validate(
                input.ArtifactType,
                targetFilePath,
                preparedContent);
            if (!validationResult.IsValid)
            {
                throw new UserFriendlyException(string.Join(Environment.NewLine, validationResult.Errors));
            }

            string workspaceKey = BuildWorkspaceKey(input.BackendId, input.SessionUserId);
            string workspaceRoot = PrepareWorkspaceRoot(input.BackendId, input.SessionUserId);
            string workspaceFilePath = BuildWorkspaceFilePath(workspaceRoot, targetFilePath);
            Directory.CreateDirectory(Path.GetDirectoryName(workspaceFilePath) ?? workspaceRoot);
            await File.WriteAllTextAsync(workspaceFilePath, preparedContent, cancellationToken);

            GenerationArtifactComparisonResultDto comparisonResult = targetExists
                ? _artifactComparisonService.Compare(await File.ReadAllTextAsync(targetFilePath, cancellationToken), preparedContent)
                : new GenerationArtifactComparisonResultDto
                {
                    ExistingFileExists = false,
                    HasMeaningfulDifference = true
                };

            return new GenerationArtifactDto
            {
                TargetFilePath = targetFilePath,
                ArtifactType = input.ArtifactType,
                GeneratedContent = preparedContent,
                TargetExists = targetExists,
                HasMeaningfulDifference = comparisonResult.HasMeaningfulDifference,
                ProtectedRegionsDetected = protectedRegionsDetected,
                IsGeneratorOwnedFile = true,
                WorkspaceKey = workspaceKey,
                WorkspaceFilePath = workspaceFilePath,
                RequiresMalformedRegionDecision = false,
                RequiresOverwriteConfirmation = targetExists && comparisonResult.HasMeaningfulDifference,
                ApplyStatus = GenerationArtifactApplyStatus.Staged,
                AppliedMalformedRegionDecision = input.MalformedRegionDecision,
                MalformedRegionWarning = targetExists && input.MalformedRegionDecision != MalformedProtectedRegionDecision.Unspecified
                    ? new MalformedProtectedRegionWarningDto
                    {
                        TargetFilePath = targetFilePath,
                        RequiresUserDecision = false,
                        Message = input.MalformedRegionDecision == MalformedProtectedRegionDecision.Repair
                            ? "Malformed protected regions were repaired with best-effort reinjection. Review preserved manual code carefully because some content may have been lost."
                            : "Malformed protected regions were preserved by appending recoverable manual code to the end of the generated file."
                    }
                    : null,
                ProtectedRegions = protectedRegions.ToList(),
                SourceMetadata = new GenerationArtifactSourceMetadataDto
                {
                    SpecId = input.SpecId,
                    ProviderModel = input.ProviderModel,
                    GeneratedAtUtc = input.GeneratedAtUtc,
                    PromptHash = ComputePromptHash(input.Prompt),
                    SourceKind = "spec-dry-run-preview",
                    SourceSectionIds = new List<Guid> { input.SourceSectionId },
                    DependencySectionIds = input.DependencySectionIds?.ToList() ?? new List<Guid>()
                }
            };
        }

        public async Task<ApplyGeneratedCodeResponseDto> ApplyArtifactsAsync(
            ApplyGeneratedCodeRequestDto input,
            long? sessionUserId,
            CancellationToken cancellationToken)
        {
            if (input == null)
            {
                throw new UserFriendlyException("An apply request is required.");
            }

            string workspaceRoot = GetWorkspaceRoot(input.WorkspaceKey, sessionUserId);
            if (!Directory.Exists(workspaceRoot))
            {
                throw new UserFriendlyException("No staged generation workspace is available for this backend.");
            }

            List<GenerationArtifactDto> artifacts = await LoadWorkspaceArtifactsAsync(workspaceRoot, cancellationToken);
            if (artifacts.Count == 0)
            {
                throw new UserFriendlyException("No staged generation artifacts are available to apply.");
            }

            ApplyGeneratedCodeResponseDto response = new ApplyGeneratedCodeResponseDto
            {
                SpecId = input.SpecId,
                WorkspaceKey = input.WorkspaceKey,
                Timestamp = DateTime.UtcNow,
                Artifacts = artifacts
            };

            if (!input.ConfirmApply)
            {
                response.RequiresApplyConfirmation = true;
                return response;
            }

            HashSet<Guid> pendingOverwriteSections = new HashSet<Guid>(
                artifacts
                    .Where(artifact => artifact.TargetExists && artifact.HasMeaningfulDifference)
                    .SelectMany(artifact => artifact.SourceMetadata?.SourceSectionIds ?? new List<Guid>()));

            foreach (GenerationArtifactDto artifact in artifacts)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (artifact.RequiresMalformedRegionDecision)
                {
                    artifact.ApplyStatus = GenerationArtifactApplyStatus.Failed;
                    continue;
                }

                if (artifact.TargetExists)
                {
                    if (!artifact.HasMeaningfulDifference)
                    {
                        artifact.ApplyStatus = GenerationArtifactApplyStatus.SkippedExistingNoDiff;
                        continue;
                    }

                    if (!input.ConfirmOverwriteExisting)
                    {
                        artifact.ApplyStatus = GenerationArtifactApplyStatus.PendingOverwrite;
                        artifact.RequiresOverwriteConfirmation = true;
                        response.RequiresOverwriteConfirmation = true;
                        continue;
                    }
                }
                else if (IsBlockedByPendingOverwrite(artifact, pendingOverwriteSections))
                {
                    artifact.ApplyStatus = GenerationArtifactApplyStatus.BlockedByDependency;
                    continue;
                }

                try
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(artifact.TargetFilePath) ?? string.Empty);
                    await File.WriteAllTextAsync(artifact.TargetFilePath, artifact.GeneratedContent ?? string.Empty, cancellationToken);
                    artifact.ApplyStatus = GenerationArtifactApplyStatus.Written;
                    response.AnyArtifactsApplied = true;
                }
                catch
                {
                    artifact.ApplyStatus = GenerationArtifactApplyStatus.Failed;
                    throw;
                }
            }

            response.AllArtifactsApplied = artifacts.All(artifact =>
                artifact.ApplyStatus == GenerationArtifactApplyStatus.Written
                || artifact.ApplyStatus == GenerationArtifactApplyStatus.SkippedExistingNoDiff);

            await PersistWorkspaceArtifactsAsync(workspaceRoot, artifacts, cancellationToken);
            return response;
        }

        public Task ClearWorkspaceAsync(Guid backendId, long? sessionUserId, CancellationToken cancellationToken)
        {
            string backendWorkspaceRoot = Path.Combine(
                Path.GetTempPath(),
                WorkspaceRootFolderName,
                sessionUserId?.ToString() ?? "anonymous",
                backendId.ToString("N"));

            if (Directory.Exists(backendWorkspaceRoot))
            {
                Directory.Delete(backendWorkspaceRoot, true);
            }

            return Task.CompletedTask;
        }

        private static void ValidateInput(GenerationCodeWriterInputDto input)
        {
            if (input == null)
            {
                throw new UserFriendlyException("A generation artifact input is required.");
            }

            if (input.BackendId == Guid.Empty || input.SpecId == Guid.Empty)
            {
                throw new UserFriendlyException("Backend and spec identities are required.");
            }

            if (input.ArtifactType == GenerationArtifactType.Unknown)
            {
                throw new UserFriendlyException("A supported generation artifact type is required.");
            }

            if (string.IsNullOrWhiteSpace(input.TargetFolderPath))
            {
                throw new UserFriendlyException("An approved target folder is required.");
            }

            if (string.IsNullOrWhiteSpace(input.ProjectPath) || string.IsNullOrWhiteSpace(input.ProjectName))
            {
                throw new UserFriendlyException("Project context is required for deterministic artifact scaffolding.");
            }
        }

        private static string BuildTargetFilePath(string targetFolderPath, string specTitle, GenerationArtifactType artifactType)
        {
            string safeFolderPath = Path.GetFullPath(targetFolderPath.Trim());
            string baseName = BuildSafeIdentifier(specTitle);
            string fileName = artifactType switch
            {
                GenerationArtifactType.AppServiceInterface => string.Format("I{0}AppService.cs", baseName),
                GenerationArtifactType.AppServiceClass => string.Format("{0}AppService.cs", baseName),
                GenerationArtifactType.Dto => string.Format("{0}Dto.cs", baseName),
                GenerationArtifactType.Repository => string.Format("{0}Repository.cs", baseName),
                GenerationArtifactType.DomainEntity => string.Format("{0}.cs", baseName),
                GenerationArtifactType.PermissionSeed => string.Format("{0}AuthorizationProvider.cs", baseName),
                _ => throw new UserFriendlyException("Unsupported generation artifact type.")
            };

            return Path.Combine(safeFolderPath, fileName);
        }

        private static string BuildSafeIdentifier(string value)
        {
            string[] parts = (value ?? string.Empty)
                .Split(new[] { ' ', '-', '_', '.', '/', '\\' }, StringSplitOptions.RemoveEmptyEntries);
            string identifier = string.Concat(parts.Select(part =>
                char.ToUpperInvariant(part[0]) + (part.Length > 1 ? part.Substring(1) : string.Empty)));

            if (string.IsNullOrWhiteSpace(identifier))
            {
                return "GeneratedArtifact";
            }

            StringBuilder builder = new StringBuilder(identifier.Length);
            foreach (char character in identifier)
            {
                if (char.IsLetterOrDigit(character))
                {
                    builder.Append(character);
                }
            }

            return builder.Length == 0 ? "GeneratedArtifact" : builder.ToString();
        }

        private static string BuildWorkspaceKey(Guid backendId, long? sessionUserId)
        {
            return string.Format("{0}:{1}", backendId.ToString("N"), sessionUserId?.ToString() ?? "anonymous");
        }

        private static string PrepareWorkspaceRoot(Guid backendId, long? sessionUserId)
        {
            string userWorkspaceRoot = Path.Combine(
                Path.GetTempPath(),
                WorkspaceRootFolderName,
                sessionUserId?.ToString() ?? "anonymous");
            Directory.CreateDirectory(userWorkspaceRoot);

            foreach (string siblingDirectory in Directory.EnumerateDirectories(userWorkspaceRoot))
            {
                string siblingName = Path.GetFileName(siblingDirectory) ?? string.Empty;
                if (string.Equals(siblingName, backendId.ToString("N"), StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                try
                {
                    Directory.Delete(siblingDirectory, true);
                }
                catch
                {
                    // Workspace cleanup is best-effort; the active backend workspace still wins.
                }
            }

            string backendWorkspaceRoot = Path.Combine(userWorkspaceRoot, backendId.ToString("N"));
            Directory.CreateDirectory(backendWorkspaceRoot);
            return backendWorkspaceRoot;
        }

        private static string GetWorkspaceRoot(string workspaceKey, long? sessionUserId)
        {
            string[] keyParts = (workspaceKey ?? string.Empty).Split(':');
            if (keyParts.Length == 0 || string.IsNullOrWhiteSpace(keyParts[0]))
            {
                throw new UserFriendlyException("A valid generation workspace key is required.");
            }

            return Path.Combine(
                Path.GetTempPath(),
                WorkspaceRootFolderName,
                sessionUserId?.ToString() ?? "anonymous",
                keyParts[0]);
        }

        private static string BuildWorkspaceFilePath(string workspaceRoot, string targetFilePath)
        {
            string root = Path.GetPathRoot(targetFilePath) ?? string.Empty;
            string relativePath = targetFilePath.Substring(root.Length).TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            string sanitizedRoot = root.Replace(":", string.Empty).Replace("\\", "_").Replace("/", "_");
            return Path.Combine(workspaceRoot, sanitizedRoot, relativePath);
        }

        private static bool IsBlockedByPendingOverwrite(GenerationArtifactDto artifact, HashSet<Guid> pendingOverwriteSections)
        {
            if (pendingOverwriteSections.Count == 0)
            {
                return false;
            }

            List<Guid> dependencySectionIds = artifact.SourceMetadata?.DependencySectionIds ?? new List<Guid>();
            return dependencySectionIds.Any(sectionId => pendingOverwriteSections.Contains(sectionId));
        }

        private static async Task<List<GenerationArtifactDto>> LoadWorkspaceArtifactsAsync(
            string workspaceRoot,
            CancellationToken cancellationToken)
        {
            string metadataPath = Path.Combine(workspaceRoot, "artifacts.json");
            if (!File.Exists(metadataPath))
            {
                return new List<GenerationArtifactDto>();
            }

            string json = await File.ReadAllTextAsync(metadataPath, cancellationToken);
            return Newtonsoft.Json.JsonConvert.DeserializeObject<List<GenerationArtifactDto>>(json) ?? new List<GenerationArtifactDto>();
        }

        public static async Task PersistWorkspaceArtifactsAsync(
            string workspaceRoot,
            List<GenerationArtifactDto> artifacts,
            CancellationToken cancellationToken)
        {
            string metadataPath = Path.Combine(workspaceRoot, "artifacts.json");
            string json = Newtonsoft.Json.JsonConvert.SerializeObject(artifacts);
            await File.WriteAllTextAsync(metadataPath, json, cancellationToken);
        }

        private static string ComputePromptHash(string prompt)
        {
            using SHA256 sha256 = SHA256.Create();
            byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(prompt ?? string.Empty));
            return Convert.ToHexString(hashBytes);
        }
    }
}
