using Abp.Application.Services;
using SeeSpec.MultiTenancy.Dto;

namespace SeeSpec.MultiTenancy
{
    public interface ITenantAppService : IAsyncCrudAppService<TenantDto, int, PagedTenantResultRequestDto, CreateTenantDto, TenantDto>
    {
    }
}

