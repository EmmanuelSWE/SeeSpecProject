using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using SeeSpec.Services.ValidationResultService.DTO;

namespace SeeSpec.Services.ValidationResultService
{
    public interface IValidationResultAppService : IAsyncCrudAppService<ValidationResultDto, Guid, PagedAndSortedResultRequestDto, ValidationResultDto, ValidationResultDto>
    {
    }
}

