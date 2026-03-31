using System;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using SeeSpec.Services.SpecService.DTO;

namespace SeeSpec.Services.SpecService
{
    public interface ISpecAppService : IAsyncCrudAppService<SpecDto, Guid, PagedAndSortedResultRequestDto, SpecDto, SpecDto>
    {
        Task<AssembledSpecDto> SaveContentAsync(SaveSpecContentDto input);

        Task<AssembledSpecDto> AssembleAsync(EntityDto<Guid> input);

        Task<AssembledSpecDto> EnsureCanonicalStructureAsync(EntityDto<Guid> input);
    }
}

