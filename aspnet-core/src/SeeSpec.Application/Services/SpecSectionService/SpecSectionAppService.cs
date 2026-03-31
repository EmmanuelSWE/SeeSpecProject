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
            var isOverviewSection = input.SectionType == SectionType.Shared
                && string.Equals(input.Slug, "overview", StringComparison.OrdinalIgnoreCase);

            if (isOverviewSection)
            {
                // Overview still behaves as a singleton, but it is modeled with the existing Shared section type.
                SpecSection existingOverview = await Repository.FirstOrDefaultAsync(
                    item => item.SpecId == input.SpecId
                        && item.SectionType == SectionType.Shared
                        && item.Slug == "overview"
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
    }
}

