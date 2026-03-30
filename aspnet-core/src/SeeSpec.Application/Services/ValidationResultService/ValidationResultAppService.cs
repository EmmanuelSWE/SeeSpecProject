using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using SeeSpec.Domains.CodingManagement;
using SeeSpec.Services.ValidationResultService.DTO;

namespace SeeSpec.Services.ValidationResultService
{
    [AbpAuthorize]
    public class ValidationResultAppService : AsyncCrudAppService<ValidationResult, ValidationResultDto, Guid, PagedAndSortedResultRequestDto, ValidationResultDto, ValidationResultDto>, IValidationResultAppService
    {
        public ValidationResultAppService(IRepository<ValidationResult, Guid> repository)
            : base(repository)
        {
        }
    }
}

