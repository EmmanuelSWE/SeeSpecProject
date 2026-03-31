using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using BackendEntity = SeeSpec.Domains.ProjectManagement.Backend;
using BackendStatus = SeeSpec.Domains.ProjectManagement.BackendStatus;
using SeeSpec.Services.BackendService.DTO;

namespace SeeSpec.Services.BackendService
{
    public class BackendImportService : SeeSpecAppServiceBase, IBackendImportService, ITransientDependency
    {
        private const string TempRootFolderName = "SeeSpecBackendImports";
        private readonly IRepository<BackendEntity, Guid> _backendRepository;

        public BackendImportService(IRepository<BackendEntity, Guid> backendRepository)
        {
            _backendRepository = backendRepository;
        }

        public async Task<BackendUploadResultDto> ImportArchiveAsync(Stream fileStream, string fileName, CancellationToken cancellationToken)
        {
            if (fileStream == null)
            {
                throw new UserFriendlyException("A backend archive file is required.");
            }

            if (!AbpSession.TenantId.HasValue)
            {
                throw new UserFriendlyException("A tenant context is required to import a backend.");
            }

            var sanitizedFileName = string.IsNullOrWhiteSpace(fileName) ? "backend.zip" : Path.GetFileName(fileName);
            var fileExtension = Path.GetExtension(sanitizedFileName);
            if (!fileExtension.Equals(".zip", StringComparison.OrdinalIgnoreCase))
            {
                throw new UserFriendlyException("Only .zip backend archives are supported.");
            }

            var importId = Guid.NewGuid().ToString("N");
            var tempRootPath = Path.Combine(Path.GetTempPath(), TempRootFolderName, importId);
            var archivePath = Path.Combine(tempRootPath, "upload.zip");
            var extractedPath = Path.Combine(tempRootPath, "extracted");

            Directory.CreateDirectory(tempRootPath);
            Directory.CreateDirectory(extractedPath);

            try
            {
                // Stream the upload directly to temp storage so large archives are not buffered fully in memory.
                using (var archiveWriteStream = new FileStream(archivePath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, FileOptions.Asynchronous))
                {
                    await fileStream.CopyToAsync(archiveWriteStream, 81920, cancellationToken);
                }

                var extractionResult = await ExtractArchiveAsync(archivePath, extractedPath, cancellationToken);

                // Validation stays lightweight and deterministic in this milestone; deeper Roslyn analysis comes later.
                ValidateArchiveContents(extractionResult);

                var backendName = ResolveBackendName(extractionResult, extractedPath);
                var backendSlug = await BuildUniqueSlugAsync(backendName, AbpSession.TenantId.Value);

                // Only create the Backend after the uploaded archive is proven to be a valid ABP backend.
                var backend = await _backendRepository.InsertAsync(new BackendEntity
                {
                    TenantId = AbpSession.TenantId.Value,
                    Name = TrimToLength(backendName, 128),
                    Slug = backendSlug,
                    Framework = "ABP",
                    RuntimeVersion = string.Empty,
                    Description = "Imported from uploaded archive.",
                    RepositoryUrl = string.Empty,
                    Status = BackendStatus.Draft
                });

                await CurrentUnitOfWork.SaveChangesAsync();

                // The extracted context remains temporary in this milestone so later analysis can reuse it
                // without committing to permanent file storage yet.
                await SaveImportContextAsync(tempRootPath, archivePath, extractedPath, extractionResult, backend.Id, cancellationToken);

                return new BackendUploadResultDto
                {
                    BackendId = backend.Id,
                    Name = backend.Name,
                    Status = backend.Status,
                    NextAction = "Backend imported and ready for analysis."
                };
            }
            catch
            {
                DeleteDirectoryIfExists(tempRootPath);
                throw;
            }
        }

        private static async Task<ArchiveExtractionResult> ExtractArchiveAsync(string archivePath, string extractedPath, CancellationToken cancellationToken)
        {
            try
            {
                using (var archiveStream = new FileStream(archivePath, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, FileOptions.Asynchronous))
                using (var archive = new ZipArchive(archiveStream, ZipArchiveMode.Read, false))
                {
                    var projectFiles = new List<string>();
                    var solutionFiles = new List<string>();
                    var abpProjectDetected = false;
                    var abpSourceDetected = false;

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

                        var fileExtension = Path.GetExtension(destinationPath);
                        if (fileExtension.Equals(".sln", StringComparison.OrdinalIgnoreCase))
                        {
                            solutionFiles.Add(destinationPath);
                            continue;
                        }

                        if (fileExtension.Equals(".csproj", StringComparison.OrdinalIgnoreCase))
                        {
                            projectFiles.Add(destinationPath);
                            var projectContents = await File.ReadAllTextAsync(destinationPath, cancellationToken);
                            if (!abpProjectDetected && projectContents.IndexOf("Volo.Abp", StringComparison.OrdinalIgnoreCase) >= 0)
                            {
                                abpProjectDetected = true;
                            }

                            continue;
                        }

                        if (!abpSourceDetected && fileExtension.Equals(".cs", StringComparison.OrdinalIgnoreCase))
                        {
                            var sourceContents = await File.ReadAllTextAsync(destinationPath, cancellationToken);
                            if (sourceContents.IndexOf("using Volo.Abp", StringComparison.OrdinalIgnoreCase) >= 0)
                            {
                                abpSourceDetected = true;
                            }
                        }
                    }

                    return new ArchiveExtractionResult
                    {
                        SolutionFiles = solutionFiles,
                        ProjectFiles = projectFiles,
                        HasAbpMarker = abpProjectDetected || abpSourceDetected
                    };
                }
            }
            catch (InvalidDataException)
            {
                throw new UserFriendlyException("The uploaded file is not a valid zip archive.");
            }
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

        private static void ValidateArchiveContents(ArchiveExtractionResult extractionResult)
        {
            if (extractionResult.SolutionFiles.Count == 0 && extractionResult.ProjectFiles.Count == 0)
            {
                throw new UserFriendlyException("The uploaded archive must contain a .sln or .csproj file.");
            }

            if (!extractionResult.HasAbpMarker)
            {
                throw new UserFriendlyException("The uploaded archive does not appear to contain an ABP backend.");
            }
        }

        private static string ResolveBackendName(ArchiveExtractionResult extractionResult, string extractedPath)
        {
            if (extractionResult.SolutionFiles.Count > 0)
            {
                return Path.GetFileNameWithoutExtension(extractionResult.SolutionFiles[0]);
            }

            if (extractionResult.ProjectFiles.Count > 0)
            {
                return Path.GetFileNameWithoutExtension(extractionResult.ProjectFiles[0]);
            }

            var rootDirectory = new DirectoryInfo(extractedPath)
                .GetDirectories()
                .OrderBy(directory => directory.Name, StringComparer.OrdinalIgnoreCase)
                .FirstOrDefault();

            return rootDirectory != null ? rootDirectory.Name : new DirectoryInfo(extractedPath).Name;
        }

        private async Task<string> BuildUniqueSlugAsync(string backendName, int tenantId)
        {
            var baseSlug = Slugify(backendName);
            var candidateSlug = BuildSlugCandidate(baseSlug, null);
            var suffix = 1;

            while (await _backendRepository.GetAll().AnyAsync(x => x.TenantId == tenantId && x.Slug == candidateSlug))
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

        private static string TrimToLength(string value, int maxLength)
        {
            var safeValue = string.IsNullOrWhiteSpace(value) ? "Imported Backend" : value.Trim();
            return safeValue.Length <= maxLength ? safeValue : safeValue.Substring(0, maxLength);
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

        private static async Task SaveImportContextAsync(
            string tempRootPath,
            string archivePath,
            string extractedPath,
            ArchiveExtractionResult extractionResult,
            Guid backendId,
            CancellationToken cancellationToken)
        {
            var context = new ImportContextFile
            {
                BackendId = backendId,
                ArchivePath = archivePath,
                ExtractedPath = extractedPath,
                SolutionFiles = extractionResult.SolutionFiles,
                ProjectFiles = extractionResult.ProjectFiles
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

        private sealed class ArchiveExtractionResult
        {
            public List<string> SolutionFiles { get; set; }

            public List<string> ProjectFiles { get; set; }

            public bool HasAbpMarker { get; set; }
        }

        private sealed class ImportContextFile
        {
            public Guid BackendId { get; set; }

            public string ArchivePath { get; set; }

            public string ExtractedPath { get; set; }

            public List<string> SolutionFiles { get; set; }

            public List<string> ProjectFiles { get; set; }
        }
    }
}
