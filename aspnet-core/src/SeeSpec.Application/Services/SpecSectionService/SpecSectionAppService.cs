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
            if (input.SectionType == SectionType.Overview)
            {
                // Overview is a singleton per backend spec, so a second "create" must update the existing overview instead.
                SpecSection existingOverview = await Repository.FirstOrDefaultAsync(
                    item => item.SpecId == input.SpecId && item.SectionType == SectionType.Overview
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

