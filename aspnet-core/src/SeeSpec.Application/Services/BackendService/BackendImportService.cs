using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Xml.Linq;
using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using BackendEntity = SeeSpec.Domains.ProjectManagement.Backend;
using BackendStatus = SeeSpec.Domains.ProjectManagement.BackendStatus;
using SeeSpec.Services.BackendService.DTO;
using SeeSpec.Services.SpecService;
using Abp.Application.Services.Dto;

namespace SeeSpec.Services.BackendService
{
    public class BackendImportService : SeeSpecAppServiceBase, IBackendImportService, ITransientDependency
    {
        private const string TempRootFolderName = "SeeSpecBackendImports";
        private readonly IRepository<BackendEntity, Guid> _backendRepository;
        private readonly ISpecAppService _specAppService;

        public BackendImportService(IRepository<BackendEntity, Guid> backendRepository, ISpecAppService specAppService)
        {
            _backendRepository = backendRepository;
            _specAppService = specAppService;
        }

        public async Task<BackendUploadResultDto> ImportArchiveAsync(Stream fileStream, string fileName, CancellationToken cancellationToken)
        {
            if (fileStream == null)
            {
                throw new UserFriendlyException("A backend archive file is required.");
            }

            EnsureTenantContext();

            if (!await LooksLikeZipArchiveAsync(fileStream, cancellationToken))
            {
                throw new UserFriendlyException("The uploaded file must be a valid zip archive.");
            }

            var tempWorkspace = CreateTemporaryWorkspace();
            try
            {
                var archivePath = Path.Combine(tempWorkspace.RootPath, "upload.zip");
                var extractedPath = Path.Combine(tempWorkspace.RootPath, "extracted");
                Directory.CreateDirectory(extractedPath);

                // Zip input resolves into a temp extracted folder first, then both zip and folder modes
                // converge into the same workspace-based validation path.
                using (var archiveWriteStream = new FileStream(archivePath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, FileOptions.Asynchronous))
                {
                    await fileStream.CopyToAsync(archiveWriteStream, 81920, cancellationToken);
                }

                await ExtractArchiveAsync(archivePath, extractedPath, cancellationToken);
                return await ImportResolvedWorkspaceAsync(extractedPath, tempWorkspace.RootPath, cancellationToken);
            }
            catch
            {
                DeleteDirectoryIfExists(tempWorkspace.RootPath);
                throw;
            }
        }

        public async Task<BackendUploadResultDto> ImportFolderAsync(string folderPath, CancellationToken cancellationToken)
        {
            EnsureTenantContext();

            var normalizedFolderPath = NormalizeFolderPath(folderPath);
            if (!Directory.Exists(normalizedFolderPath))
            {
                throw new UserFriendlyException("The supplied backend folder does not exist.");
            }

            // Direct folder imports reuse the same workspace validation path as extracted zip uploads.
            return await ImportResolvedWorkspaceAsync(normalizedFolderPath, null, cancellationToken);
        }

        private void EnsureTenantContext()
        {
            if (!AbpSession.TenantId.HasValue)
            {
                throw new UserFriendlyException("A tenant context is required to import a backend.");
            }
        }

        private async Task<BackendUploadResultDto> ImportResolvedWorkspaceAsync(
            string workspacePath,
            string temporaryRootPath,
            CancellationToken cancellationToken)
        {
            var resolvedWorkspacePath = NormalizeFolderPath(workspacePath);
            var validationResult = await ValidateWorkspaceAsync(resolvedWorkspacePath, cancellationToken);
            var backendName = ResolveBackendName(validationResult, resolvedWorkspacePath);
            var backendSlug = await BuildUniqueSlugAsync(backendName, AbpSession.TenantId.Value);

            // Backend creation stays behind successful validation so invalid imports never create records.
            var backend = await _backendRepository.InsertAsync(new BackendEntity
            {
                TenantId = AbpSession.TenantId.Value,
                Name = TrimToLength(backendName, 128),
                Slug = backendSlug,
                Framework = "ABP",
                RuntimeVersion = string.Empty,
                Description = "Imported from backend workspace.",
                RepositoryUrl = string.Empty,
                Status = BackendStatus.Draft
            });

            await CurrentUnitOfWork.SaveChangesAsync();
            await _specAppService.EnsureCanonicalStructureAsync(new EntityDto<Guid>(backend.Id));

            if (!string.IsNullOrWhiteSpace(temporaryRootPath))
            {
                await SaveImportContextAsync(temporaryRootPath, resolvedWorkspacePath, validationResult, backend.Id, cancellationToken);
            }

            return new BackendUploadResultDto
            {
                BackendId = backend.Id,
                Name = backend.Name,
                Status = backend.Status,
                NextAction = "Backend imported and ready for analysis."
            };
        }

        private static TemporaryWorkspace CreateTemporaryWorkspace()
        {
            var importId = Guid.NewGuid().ToString("N");
            var rootPath = Path.Combine(Path.GetTempPath(), TempRootFolderName, importId);
            Directory.CreateDirectory(rootPath);
            return new TemporaryWorkspace
            {
                RootPath = rootPath
            };
        }

        private static async Task ExtractArchiveAsync(string archivePath, string extractedPath, CancellationToken cancellationToken)
        {
            try
            {
                using (var archiveStream = new FileStream(archivePath, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, FileOptions.Asynchronous))
                using (var archive = new ZipArchive(archiveStream, ZipArchiveMode.Read, false))
                {
                    foreach (var entry in archive.Entries)
                    {
                        cancellationToken.ThrowIfCancellationRequested();

                        var destinationPath = GetSafeExtractionPath(extractedPath, entry.FullName);
                        if (string.IsNullOrEmpty(entry.Name))
                        {
                            Directory.CreateDirectory(destinationPath);
                            continue;
                        }

                        var destinationDirectory = Path.GetDirectoryName(destinationPath);
                        if (string.IsNullOrWhiteSpace(destinationDirectory))
                        {
                            throw new UserFriendlyException("The uploaded archive contains an invalid file path.");
                        }

                        Directory.CreateDirectory(destinationDirectory);

                        using (var entryStream = entry.Open())
                        using (var destinationStream = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, FileOptions.Asynchronous))
                        {
                            await entryStream.CopyToAsync(destinationStream, 81920, cancellationToken);
                        }
                    }
                }
            }
            catch (InvalidDataException)
            {
                throw new UserFriendlyException("The uploaded file is not a valid zip archive.");
            }
        }

        private static async Task<bool> LooksLikeZipArchiveAsync(Stream fileStream, CancellationToken cancellationToken)
        {
            if (!fileStream.CanRead)
            {
                return false;
            }

            var originalPosition = fileStream.CanSeek ? fileStream.Position : 0L;
            var header = new byte[4];

            try
            {
                if (fileStream.CanSeek)
                {
                    fileStream.Seek(0L, SeekOrigin.Begin);
                }

                var bytesRead = await fileStream.ReadAsync(header, 0, header.Length, cancellationToken);
                if (bytesRead < header.Length)
                {
                    return false;
                }

                return header[0] == 0x50
                    && header[1] == 0x4B
                    && (
                        (header[2] == 0x03 && header[3] == 0x04) ||
                        (header[2] == 0x05 && header[3] == 0x06) ||
                        (header[2] == 0x07 && header[3] == 0x08)
                    );
            }
            finally
            {
                if (fileStream.CanSeek)
                {
                    fileStream.Seek(originalPosition, SeekOrigin.Begin);
                }
            }
        }

        private static async Task<WorkspaceValidationResult> ValidateWorkspaceAsync(string workspacePath, CancellationToken cancellationToken)
        {
            var solutionFiles = Directory.GetFiles(workspacePath, "*.sln", SearchOption.AllDirectories)
                .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
                .ToList();
            var projectFiles = Directory.GetFiles(workspacePath, "*.csproj", SearchOption.AllDirectories)
                .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (solutionFiles.Count == 0 && projectFiles.Count == 0)
            {
                throw new UserFriendlyException("The imported workspace must contain a .sln or .csproj file.");
            }

            // Validation now anchors on the .Core project/folder because that is the stable place where
            // the backend's core package references identify the ABP stack deterministically.
            var coreProject = FindCoreProject(projectFiles);
            if (coreProject == null)
            {
                throw new UserFriendlyException("The imported workspace does not contain a .Core project or folder.");
            }

            var packageReferences = await ReadPackageReferencesAsync(coreProject.ProjectPath, cancellationToken);
            if (packageReferences.Count == 0)
            {
                throw new UserFriendlyException("The .Core project does not expose any package references to validate.");
            }

            // ABP detection is package-based now: any .Core package reference that starts with Abp
            // is enough to confirm the imported workspace belongs to the ABP stack.
            var abpPackage = packageReferences.FirstOrDefault(packageName => packageName.StartsWith("Abp", StringComparison.OrdinalIgnoreCase));
            if (string.IsNullOrWhiteSpace(abpPackage))
            {
                throw new UserFriendlyException("The .Core project does not reference an Abp package.");
            }

            return new WorkspaceValidationResult
            {
                SolutionFiles = solutionFiles,
                ProjectFiles = projectFiles,
                CoreProjectPath = coreProject.ProjectPath,
                CoreDirectoryPath = coreProject.CoreDirectoryPath,
                DetectedPackages = packageReferences
            };
        }

        private static CoreProjectMatch FindCoreProject(IReadOnlyCollection<string> projectFiles)
        {
            return projectFiles
                .Select(projectPath =>
                {
                    var projectName = Path.GetFileNameWithoutExtension(projectPath) ?? string.Empty;
                    var projectDirectory = Path.GetDirectoryName(projectPath) ?? string.Empty;
                    var directoryName = Path.GetFileName(projectDirectory) ?? string.Empty;
                    var isCoreProject =
                        projectName.EndsWith(".Core", StringComparison.OrdinalIgnoreCase) ||
                        directoryName.EndsWith(".Core", StringComparison.OrdinalIgnoreCase);

                    return new CoreProjectMatch
                    {
                        ProjectPath = projectPath,
                        CoreDirectoryPath = projectDirectory,
                        IsMatch = isCoreProject
                    };
                })
                .Where(match => match.IsMatch)
                .OrderBy(match => match.ProjectPath, StringComparer.OrdinalIgnoreCase)
                .FirstOrDefault();
        }

        private static async Task<List<string>> ReadPackageReferencesAsync(string projectPath, CancellationToken cancellationToken)
        {
            var projectXml = await File.ReadAllTextAsync(projectPath, cancellationToken);
            var document = XDocument.Parse(projectXml, LoadOptions.PreserveWhitespace);

            return document
                .Descendants()
                .Where(node => string.Equals(node.Name.LocalName, "PackageReference", StringComparison.Ordinal))
                .Select(node => (node.Attribute("Include")?.Value ?? string.Empty).Trim())
                .Where(packageName => !string.IsNullOrWhiteSpace(packageName))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(packageName => packageName, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private static string ResolveBackendName(WorkspaceValidationResult validationResult, string workspacePath)
        {
            if (validationResult.SolutionFiles.Count > 0)
            {
                return Path.GetFileNameWithoutExtension(validationResult.SolutionFiles[0]);
            }

            if (validationResult.ProjectFiles.Count > 0)
            {
                return Path.GetFileNameWithoutExtension(validationResult.ProjectFiles[0]);
            }

            return new DirectoryInfo(workspacePath).Name;
        }

        private async Task<string> BuildUniqueSlugAsync(string backendName, int tenantId)
        {
            var baseSlug = Slugify(backendName);
            var candidateSlug = BuildSlugCandidate(baseSlug, null);
            var suffix = 1;

            while (await _backendRepository.GetAll().AnyAsync(item => item.TenantId == tenantId && item.Slug == candidateSlug))
            {
                candidateSlug = BuildSlugCandidate(baseSlug, suffix);
                suffix++;
            }

            return candidateSlug;
        }

        private static string Slugify(string value)
        {
            var normalized = (value ?? string.Empty).Trim().ToLowerInvariant();
            var builder = new StringBuilder(normalized.Length);
            var previousWasSeparator = false;

            foreach (var character in normalized)
            {
                if (char.IsLetterOrDigit(character))
                {
                    builder.Append(character);
                    previousWasSeparator = false;
                    continue;
                }

                if (!previousWasSeparator)
                {
                    builder.Append('-');
                    previousWasSeparator = true;
                }
            }

            var slug = builder.ToString().Trim('-');
            return string.IsNullOrWhiteSpace(slug) ? string.Format("backend-{0}", Guid.NewGuid().ToString("N")) : slug;
        }

        private static string BuildSlugCandidate(string baseSlug, int? suffix)
        {
            if (!suffix.HasValue)
            {
                return TrimToLength(baseSlug, 128);
            }

            var suffixText = string.Format("-{0}", suffix.Value);
            var maxBaseLength = 128 - suffixText.Length;
            var trimmedBase = baseSlug.Length <= maxBaseLength ? baseSlug : baseSlug.Substring(0, maxBaseLength);
            return string.Concat(trimmedBase, suffixText);
        }

        private static string TrimToLength(string value, int maxLength)
        {
            var safeValue = string.IsNullOrWhiteSpace(value) ? "Imported Backend" : value.Trim();
            return safeValue.Length <= maxLength ? safeValue : safeValue.Substring(0, maxLength);
        }

        private static string NormalizeFolderPath(string folderPath)
        {
            return Path.GetFullPath((folderPath ?? string.Empty).Trim());
        }

        private static string GetSafeExtractionPath(string extractedPath, string entryPath)
        {
            var normalizedExtractionRoot = Path.GetFullPath(extractedPath);
            var normalizedExtractionRootWithSeparator = normalizedExtractionRoot.EndsWith(Path.DirectorySeparatorChar.ToString(), StringComparison.Ordinal)
                ? normalizedExtractionRoot
                : normalizedExtractionRoot + Path.DirectorySeparatorChar;
            var destinationPath = Path.GetFullPath(Path.Combine(normalizedExtractionRoot, entryPath));
            if (!destinationPath.StartsWith(normalizedExtractionRootWithSeparator, StringComparison.OrdinalIgnoreCase)
                && !destinationPath.Equals(normalizedExtractionRoot, StringComparison.OrdinalIgnoreCase))
            {
                throw new UserFriendlyException("The uploaded archive contains an unsafe file path.");
            }

            return destinationPath;
        }

        private static async Task SaveImportContextAsync(
            string tempRootPath,
            string workspacePath,
            WorkspaceValidationResult validationResult,
            Guid backendId,
            CancellationToken cancellationToken)
        {
            var context = new ImportContextFile
            {
                BackendId = backendId,
                WorkspacePath = workspacePath,
                SolutionFiles = validationResult.SolutionFiles,
                ProjectFiles = validationResult.ProjectFiles,
                CoreProjectPath = validationResult.CoreProjectPath,
                CoreDirectoryPath = validationResult.CoreDirectoryPath,
                DetectedPackages = validationResult.DetectedPackages
            };

            var contextPath = Path.Combine(tempRootPath, "import-context.json");
            var serializedContext = JsonConvert.SerializeObject(context, Formatting.Indented);
            await File.WriteAllTextAsync(contextPath, serializedContext, cancellationToken);
        }

        private static void DeleteDirectoryIfExists(string directoryPath)
        {
            if (!Directory.Exists(directoryPath))
            {
                return;
            }

            try
            {
                Directory.Delete(directoryPath, true);
            }
            catch
            {
                // Best-effort cleanup is enough here; the import error itself remains the important signal.
            }
        }

        private sealed class TemporaryWorkspace
        {
            public string RootPath { get; set; }
        }

        private sealed class CoreProjectMatch
        {
            public string ProjectPath { get; set; }

            public string CoreDirectoryPath { get; set; }

            public bool IsMatch { get; set; }
        }

        private sealed class WorkspaceValidationResult
        {
            public List<string> SolutionFiles { get; set; }

            public List<string> ProjectFiles { get; set; }

            public string CoreProjectPath { get; set; }

            public string CoreDirectoryPath { get; set; }

            public List<string> DetectedPackages { get; set; }
        }

        private sealed class ImportContextFile
        {
            public Guid BackendId { get; set; }

            public string WorkspacePath { get; set; }

            public List<string> SolutionFiles { get; set; }

            public List<string> ProjectFiles { get; set; }

            public string CoreProjectPath { get; set; }

            public string CoreDirectoryPath { get; set; }

            public List<string> DetectedPackages { get; set; }
        }
    }
}
