using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Collections.Extensions;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using SeeSpec.Domains.SpecManagement;
using SeeSpec.Domains.ProjectManagement;
using SeeSpec.Services.BackendService.DTO;
using SeeSpec.Services.SpecService;

namespace SeeSpec.Services.BackendService
{
    [AbpAuthorize]
    public class BackendAppService : AsyncCrudAppService<Backend, BackendDto, Guid, PagedAndSortedResultRequestDto, BackendDto, BackendDto>, IBackendAppService
    {
        private const long MaxUploadSizeBytes = 300L * 1024L * 1024L;

        private readonly ISpecAppService _specAppService;
        private readonly IBackendImportService _backendImportService;
        private readonly IRepository<Spec, Guid> _specRepository;
        private readonly IRepository<SpecSection, Guid> _specSectionRepository;
        private readonly IRepository<DiagramElement, Guid> _diagramElementRepository;

        public BackendAppService(
            IRepository<Backend, Guid> repository,
            ISpecAppService specAppService,
            IBackendImportService backendImportService,
            IRepository<Spec, Guid> specRepository,
            IRepository<SpecSection, Guid> specSectionRepository,
            IRepository<DiagramElement, Guid> diagramElementRepository)
            : base(repository)
        {
            _specAppService = specAppService;
            _backendImportService = backendImportService;
            _specRepository = specRepository;
            _specSectionRepository = specSectionRepository;
            _diagramElementRepository = diagramElementRepository;
        }

        public async Task<BackendDto> GetBySlugAsync(GetBackendBySlugInputDto input)
        {
            if (input == null || string.IsNullOrWhiteSpace(input.Slug))
            {
                throw new UserFriendlyException("A backend slug is required.");
            }

            // Route-scoped pages must resolve the backend directly instead of depending on a paged list lookup.
            var backend = await AsyncQueryableExecuter.FirstOrDefaultAsync(
                Repository.GetAll().Where(x => x.Slug == input.Slug));

            return backend == null ? null : MapToEntityDto(backend);
        }

        public override async Task<BackendDto> CreateAsync(BackendDto input)
        {
            BackendDto backend = await base.CreateAsync(input);

            // Backend creation stops at Backend + Spec so overview authoring remains the explicit
            // semantic gate before any downstream sections or diagrams are introduced.
            await _specAppService.EnsureSpecAsync(new EntityDto<Guid>(backend.Id));

            return backend;
        }

        public async Task<BackendWorkflowReadinessDto> GetWorkflowReadinessAsync(GetBackendWorkflowReadinessInputDto input)
        {
            if (input == null || input.BackendId == Guid.Empty)
            {
                throw new UserFriendlyException("A backend id is required.");
            }

            Spec spec = await _specRepository.GetAll().FirstOrDefaultAsync(item => item.BackendId == input.BackendId);
            BackendWorkflowReadinessDto readiness = new BackendWorkflowReadinessDto
            {
                BackendId = input.BackendId,
                SpecId = spec?.Id
            };

            if (spec == null)
            {
                readiness.MissingItems.Add("Create the specification for this backend.");
                readiness.MissingItems.Add("Complete and accept the overview.");
                readiness.MissingItems.Add("Add at least one backend role.");
                readiness.MissingItems.Add("Create at least one requirement.");
                readiness.MissingItems.Add("Create a domain model with at least one entity.");
                return readiness;
            }

            List<SpecSection> sections = await _specSectionRepository.GetAll()
                .Where(item => item.SpecId == spec.Id)
                .ToListAsync();
            List<DiagramElement> diagrams = await _diagramElementRepository.GetAll()
                .Where(item => item.BackendId == input.BackendId)
                .ToListAsync();

            SpecSection overviewSection = sections
                .Where(item => item.SectionType == SectionType.Shared)
                .Where(item =>
                    string.Equals(item.Slug, "overview", StringComparison.OrdinalIgnoreCase)
                    || (!string.IsNullOrWhiteSpace(item.Slug) && item.Slug.EndsWith("-overview", StringComparison.OrdinalIgnoreCase)))
                .OrderByDescending(item => item.LastModificationTime ?? item.CreationTime)
                .ThenByDescending(item => item.CreationTime)
                .ThenByDescending(item => item.Id)
                .FirstOrDefault();

            readiness.HasOverview = overviewSection != null;
            readiness.IsOverviewAccepted = IsOverviewAccepted(overviewSection);

            List<SpecSection> roleSections = sections
                .Where(item => item.SectionType == SectionType.Shared && item.Slug.StartsWith("role-", StringComparison.OrdinalIgnoreCase))
                .ToList();
            readiness.RoleCount = roleSections.Count;
            readiness.HasRoles = readiness.RoleCount > 0;
            readiness.CanCreateRequirements = readiness.IsOverviewAccepted && readiness.HasRoles;

            List<SpecSection> requirementSections = sections.Where(item => item.SectionType == SectionType.Requirement).ToList();
            readiness.RequirementCount = requirementSections.Count;
            readiness.HasRequirements = readiness.RequirementCount > 0;

            List<DiagramElement> useCaseDiagrams = diagrams.Where(item => item.DiagramType == DiagramType.UseCase).ToList();
            List<DiagramElement> activityDiagrams = diagrams.Where(item => item.DiagramType == DiagramType.Activity).ToList();
            List<DiagramElement> domainModelDiagrams = diagrams.Where(item => item.DiagramType == DiagramType.DomainModel).ToList();
            readiness.UseCaseDiagramCount = useCaseDiagrams.Count;
            readiness.ActivityDiagramCount = activityDiagrams.Count;
            readiness.HasDomainModel = domainModelDiagrams.Count > 0;
            readiness.EveryRequirementHasUseCaseDiagram = requirementSections.Count > 0
                && requirementSections.All(requirement =>
                    useCaseDiagrams.Any(diagram => diagram.SpecSectionId == requirement.Id));

            readiness.DomainEntityCount = domainModelDiagrams.Sum(CountDomainEntities);
            readiness.HasDomainEntities = readiness.DomainEntityCount > 0;

            var useCaseNodes = useCaseDiagrams
                .SelectMany(diagram => ExtractUseCaseNodes(diagram)
                    .Select(node => new UseCaseNodeReference
                    {
                        DiagramSlug = diagram.ExternalElementKey,
                        NodeId = node.NodeId,
                        Label = node.Label
                    }))
                .ToList();

            readiness.EveryUseCaseHasActivityDiagram = useCaseNodes.Count > 0;
            foreach (UseCaseNodeReference useCaseNode in useCaseNodes)
            {
                bool hasActivityDiagram = activityDiagrams.Any(diagram =>
                {
                    JObject metadata = ParseObject(diagram.MetadataJson);
                    return string.Equals(metadata?["linkedUseCaseSlug"]?.Value<string>(), useCaseNode.DiagramSlug, StringComparison.OrdinalIgnoreCase)
                        && string.Equals(metadata?["linkedUseCaseNodeId"]?.Value<string>(), useCaseNode.NodeId, StringComparison.Ordinal);
                });

                if (!hasActivityDiagram)
                {
                    readiness.EveryUseCaseHasActivityDiagram = false;
                    readiness.MissingActivityDiagramUseCases.Add(useCaseNode.Label);
                }
            }

            if (!readiness.HasOverview)
            {
                readiness.MissingItems.Add("Complete the backend overview.");
            }
            else if (!readiness.IsOverviewAccepted)
            {
                readiness.MissingItems.Add("Accept the overview to unlock the rest of the workflow.");
            }

            if (!readiness.HasRoles)
            {
                readiness.MissingItems.Add("Add at least one backend role before creating requirements.");
            }

            if (!readiness.HasRequirements)
            {
                readiness.MissingItems.Add("Create at least one requirement.");
            }
            else if (!readiness.EveryRequirementHasUseCaseDiagram)
            {
                readiness.MissingItems.Add("Every requirement must have a linked use case diagram container.");
            }

            if (!readiness.HasDomainEntities)
            {
                readiness.MissingItems.Add("Create a domain model with at least one entity.");
            }

            if (!readiness.EveryUseCaseHasActivityDiagram)
            {
                readiness.MissingItems.Add(
                    readiness.MissingActivityDiagramUseCases.Count > 0
                        ? "Create activity diagrams for: " + string.Join(", ", readiness.MissingActivityDiagramUseCases)
                        : "Every stored use case needs a linked activity diagram.");
            }

            readiness.IsCodeGenerationReady =
                readiness.IsOverviewAccepted
                && readiness.HasRoles
                && readiness.HasRequirements
                && readiness.EveryRequirementHasUseCaseDiagram
                && readiness.HasDomainEntities
                && readiness.EveryUseCaseHasActivityDiagram;

            return readiness;
        }

        public async Task<BackendUploadResultDto> UploadAsync(IFormFile file, CancellationToken cancellationToken)
        {
            if (file == null || file.Length == 0)
            {
                throw new UserFriendlyException("A backend archive file is required.");
            }

            if (file.Length > MaxUploadSizeBytes)
            {
                throw new UserFriendlyException("Backend uploads are limited to 300 MB.");
            }

            // The controller stays thin; upload orchestration lives in the backend service layer now.
            using (var readStream = file.OpenReadStream())
            {
                return await _backendImportService.ImportArchiveAsync(readStream, file.FileName, cancellationToken);
            }
        }

        public async Task<BackendUploadResultDto> ImportFolderAsync(BackendFolderImportInputDto input, CancellationToken cancellationToken)
        {
            if (input == null || string.IsNullOrWhiteSpace(input.FolderPath))
            {
                throw new UserFriendlyException("A backend folder path is required.");
            }

            // Folder imports follow the same backend service entry pattern as archive uploads.
            return await _backendImportService.ImportFolderAsync(input.FolderPath, cancellationToken);
        }

        public async Task<ListResultDto<AllowedGenerationFolderDto>> GetAllowedGenerationFoldersAsync(
            GetAllowedGenerationFoldersInputDto input,
            CancellationToken cancellationToken)
        {
            return new ListResultDto<AllowedGenerationFolderDto>(
                await _backendImportService.GetAllowedGenerationFoldersAsync(input, cancellationToken));
        }

        public Task<AllowedGenerationFolderDto> ValidateGenerationFolderAsync(
            ValidateGenerationFolderInputDto input,
            CancellationToken cancellationToken)
        {
            return _backendImportService.ValidateGenerationFolderAsync(input, cancellationToken);
        }

        protected override IQueryable<Backend> CreateFilteredQuery(PagedAndSortedResultRequestDto input)
        {
            var query = base.CreateFilteredQuery(input);

            if (AbpSession.TenantId.HasValue)
            {
                query = query.Where(x => x.TenantId == AbpSession.TenantId.Value);
            }

            return query;
        }

        private static bool IsOverviewAccepted(SpecSection overviewSection)
        {
            JObject metadata = ParseObject(overviewSection?.Content);
            return metadata?["isAccepted"]?.Value<bool>() == true;
        }

        private static int CountDomainEntities(DiagramElement diagram)
        {
            JObject metadata = ParseObject(diagram.MetadataJson);
            JToken entitiesToken = metadata?["entities"];
            if (entitiesToken is JArray entitiesArray && entitiesArray.Count > 0)
            {
                return entitiesArray.Count;
            }

            JToken graphNodes = metadata?["graph"]?["nodes"];
            return graphNodes is JArray graphNodeArray
                ? graphNodeArray.Count(node => string.Equals(node["nodeType"]?.Value<string>(), "entity", StringComparison.OrdinalIgnoreCase))
                : 0;
        }

        private static List<UseCaseNodeReference> ExtractUseCaseNodes(DiagramElement diagram)
        {
            JObject metadata = ParseObject(diagram.MetadataJson);
            JToken graphNodes = metadata?["graph"]?["nodes"];
            if (!(graphNodes is JArray graphNodeArray))
            {
                return new List<UseCaseNodeReference>();
            }

            return graphNodeArray
                .Where(node => string.Equals(node["nodeType"]?.Value<string>(), "use-case", StringComparison.OrdinalIgnoreCase))
                .Select(node => new UseCaseNodeReference
                {
                    NodeId = node["id"]?.Value<string>(),
                    Label = node["label"]?.Value<string>() ?? "Unnamed use case"
                })
                .Where(node => !string.IsNullOrWhiteSpace(node.NodeId))
                .ToList();
        }

        private static JObject ParseObject(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            try
            {
                return JObject.Parse(value);
            }
            catch
            {
                return null;
            }
        }

        private sealed class UseCaseNodeReference
        {
            public string DiagramSlug { get; set; }

            public string NodeId { get; set; }

            public string Label { get; set; }
        }
    }
}

