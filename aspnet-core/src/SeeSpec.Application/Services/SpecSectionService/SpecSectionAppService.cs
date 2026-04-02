using System;
using System.Linq;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Newtonsoft.Json.Linq;
using Microsoft.EntityFrameworkCore;
using SeeSpec.Domains.SpecManagement;
using SeeSpec.Services.SpecSectionService.DTO;

namespace SeeSpec.Services.SpecSectionService
{
    [AbpAuthorize]
    public class SpecSectionAppService : AsyncCrudAppService<SpecSection, SpecSectionDto, Guid, PagedAndSortedResultRequestDto, SpecSectionDto, SpecSectionDto>, ISpecSectionAppService
    {
        private readonly IRepository<SectionItem, Guid> _sectionItemRepository;
        private readonly IRepository<SectionDependency, Guid> _sectionDependencyRepository;

        public SpecSectionAppService(
            IRepository<SpecSection, Guid> repository,
            IRepository<SectionItem, Guid> sectionItemRepository,
            IRepository<SectionDependency, Guid> sectionDependencyRepository)
            : base(repository)
        {
            _sectionItemRepository = sectionItemRepository;
            _sectionDependencyRepository = sectionDependencyRepository;
        }

        public override async Task<SpecSectionDto> CreateAsync(SpecSectionDto input)
        {
            await ValidateSectionCreationAsync(input);

            var isOverviewSection = input.SectionType == SectionType.Shared
                && IsOverviewSlug(input.Slug);

            if (isOverviewSection)
            {
                // Overview is a singleton per spec. If drift already created duplicates, keep the
                // most recent record and delete the stale copies before returning.
                SpecSection existingOverview = await GetMostRecentOverviewSectionAsync(input.SpecId);

                if (existingOverview != null)
                {
                    existingOverview.Title = input.Title;
                    existingOverview.Slug = "overview";
                    existingOverview.Order = input.Order;
                    existingOverview.Content = input.Content;
                    existingOverview.OwnerRole = input.OwnerRole;
                    existingOverview.ParentSectionId = input.ParentSectionId;
                    existingOverview.Version = input.Version;

                    SpecSection updatedOverview = await Repository.UpdateAsync(existingOverview);
                    await NormalizeOverviewSectionsAsync(input.SpecId, updatedOverview.Id);
                    return MapToEntityDto(updatedOverview);
                }
            }

            return await base.CreateAsync(input);
        }

        public override async Task<SpecSectionDto> UpdateAsync(SpecSectionDto input)
        {
            var updated = await base.UpdateAsync(input);

            if (updated.SectionType == SectionType.Shared && IsOverviewSlug(updated.Slug))
            {
                SpecSection persistedOverview = await Repository.GetAsync(updated.Id);
                if (!string.Equals(persistedOverview.Slug, "overview", StringComparison.OrdinalIgnoreCase))
                {
                    persistedOverview.Slug = "overview";
                    await Repository.UpdateAsync(persistedOverview);
                    updated = MapToEntityDto(persistedOverview);
                }

                await NormalizeOverviewSectionsAsync(updated.SpecId, updated.Id);
            }

            return updated;
        }

        private async Task ValidateSectionCreationAsync(SpecSectionDto input)
        {
            var createsRequirementSection = input.SectionType == SectionType.Requirement
                && !string.Equals(input.Slug, "use-case-diagram", StringComparison.OrdinalIgnoreCase);

            if (!createsRequirementSection)
            {
                return;
            }

            // Overview acceptance is the hard semantic gate before requirements and the later
            // diagram flow are allowed to progress.
            if (!await IsOverviewAcceptedAsync(input.SpecId))
            {
                throw new UserFriendlyException("Accept the overview before creating requirements.");
            }
        }

        private async Task<bool> IsOverviewAcceptedAsync(Guid specId)
        {
            SpecSection overviewSection = await GetMostRecentOverviewSectionAsync(specId);

            if (overviewSection == null)
            {
                return false;
            }

            JObject metadata = ParseObject(overviewSection.Content);
            if (metadata?["isAccepted"]?.Value<bool>() == true)
            {
                return true;
            }

            SectionItem acceptanceItem = await _sectionItemRepository.FirstOrDefaultAsync(
                item => item.SpecSectionId == overviewSection.Id && item.Label == "accepted");
            if (acceptanceItem == null)
            {
                return false;
            }

            JObject acceptancePayload = ParseObject(acceptanceItem.Content);
            return acceptancePayload?["value"]?.Value<bool>() == true;
        }

        private static bool IsOverviewSlug(string slug)
        {
            return string.Equals(slug, "overview", StringComparison.OrdinalIgnoreCase)
                || (!string.IsNullOrWhiteSpace(slug) && slug.EndsWith("-overview", StringComparison.OrdinalIgnoreCase));
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

        private async Task<SpecSection> GetMostRecentOverviewSectionAsync(Guid specId)
        {
            return await Repository.GetAll()
                .Where(item => item.SpecId == specId && item.SectionType == SectionType.Shared)
                .Where(item => item.Slug == "overview" || EF.Functions.Like(item.Slug, "%-overview"))
                .OrderByDescending(item => item.LastModificationTime ?? item.CreationTime)
                .ThenByDescending(item => item.CreationTime)
                .ThenByDescending(item => item.Id)
                .FirstOrDefaultAsync();
        }

        private async Task NormalizeOverviewSectionsAsync(Guid specId, Guid keepSectionId)
        {
            var overviewSections = await Repository.GetAll()
                .Where(item => item.SpecId == specId && item.SectionType == SectionType.Shared)
                .Where(item => item.Slug == "overview" || EF.Functions.Like(item.Slug, "%-overview"))
                .OrderByDescending(item => item.LastModificationTime ?? item.CreationTime)
                .ThenByDescending(item => item.CreationTime)
                .ThenByDescending(item => item.Id)
                .ToListAsync();

            SpecSection keepSection = overviewSections.FirstOrDefault(item => item.Id == keepSectionId);
            if (keepSection == null)
            {
                return;
            }

            if (!string.Equals(keepSection.Slug, "overview", StringComparison.OrdinalIgnoreCase))
            {
                keepSection.Slug = "overview";
                await Repository.UpdateAsync(keepSection);
            }

            foreach (SpecSection duplicateSection in overviewSections.Where(item => item.Id != keepSection.Id))
            {
                var duplicateItems = await _sectionItemRepository.GetAll()
                    .Where(item => item.SpecSectionId == duplicateSection.Id)
                    .ToListAsync();

                foreach (SectionItem duplicateItem in duplicateItems)
                {
                    await _sectionItemRepository.DeleteAsync(duplicateItem);
                }

                var duplicateDependencies = await _sectionDependencyRepository.GetAll()
                    .Where(item => item.FromSectionId == duplicateSection.Id || item.ToSectionId == duplicateSection.Id)
                    .ToListAsync();

                foreach (SectionDependency duplicateDependency in duplicateDependencies)
                {
                    await _sectionDependencyRepository.DeleteAsync(duplicateDependency);
                }

                await Repository.DeleteAsync(duplicateSection);
            }
        }
    }
}

