using System;
using System.Linq;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using SeeSpec.Domains.SpecManagement;
using SeeSpec.Services.SpecSectionService.DTO;

namespace SeeSpec.Services.SpecSectionService
{
    [AbpAuthorize]
    public class SpecSectionAppService : AsyncCrudAppService<SpecSection, SpecSectionDto, Guid, PagedAndSortedResultRequestDto, SpecSectionDto, SpecSectionDto>, ISpecSectionAppService
    {
        public SpecSectionAppService(IRepository<SpecSection, Guid> repository)
            : base(repository)
        {
        }

        public override async Task<SpecSectionDto> CreateAsync(SpecSectionDto input)
        {
            if (IsOverviewSection(input.SectionType, input.Slug))
            {
                // The current domain model stores overview sections under Shared, using the overview slug to distinguish the singleton.
                SpecSection existingOverview = await Repository.FirstOrDefaultAsync(
                    item => item.SpecId == input.SpecId && IsOverviewSection(item.SectionType, item.Slug)
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

        private static bool IsOverviewSection(SectionType sectionType, string slug)
        {
            return sectionType == SectionType.Shared && !string.IsNullOrWhiteSpace(slug) && slug.EndsWith("-overview", StringComparison.OrdinalIgnoreCase);
        }
    }
}

