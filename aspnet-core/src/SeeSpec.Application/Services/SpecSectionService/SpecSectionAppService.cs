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

        public SpecSectionAppService(
            IRepository<SpecSection, Guid> repository,
            IRepository<SectionItem, Guid> sectionItemRepository)
            : base(repository)
        {
            _sectionItemRepository = sectionItemRepository;
        }

        public override async Task<SpecSectionDto> CreateAsync(SpecSectionDto input)
        {
            await ValidateSectionCreationAsync(input);

            var isOverviewSection = input.SectionType == SectionType.Shared
                && IsOverviewSlug(input.Slug);

            if (isOverviewSection)
            {
                // Overview still behaves as a singleton, but it is modeled with the existing Shared section type.
                SpecSection existingOverview = await Repository.FirstOrDefaultAsync(
                    item => item.SpecId == input.SpecId
                        && item.SectionType == SectionType.Shared
                        && (item.Slug == "overview" || EF.Functions.Like(item.Slug, "%-overview"))
                );

                if (existingOverview != null)
                {
                    existingOverview.Title = input.Title;
                    existingOverview.Slug = input.Slug;
                    existingOverview.Order = input.Order;
                    existingOverview.Content = input.Content;
                    existingOverview.OwnerRole = input.OwnerRole;
                    existingOverview.ParentSectionId = input.ParentSectionId;
                    existingOverview.Version = input.Version;

                    SpecSection updatedOverview = await Repository.UpdateAsync(existingOverview);
                    return MapToEntityDto(updatedOverview);
                }
            }

            return await base.CreateAsync(input);
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
            SpecSection overviewSection = await Repository.GetAll()
                .Where(item => item.SpecId == specId && item.SectionType == SectionType.Shared)
                .OrderBy(item => item.Order)
                .ThenBy(item => item.Id)
                .FirstOrDefaultAsync(item => item.Slug == "overview" || item.Slug.EndsWith("-overview"));

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
    }
}

