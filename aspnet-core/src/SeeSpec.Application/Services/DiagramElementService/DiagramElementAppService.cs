using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using SeeSpec.Domains.SpecManagement;
using SeeSpec.Services.DiagramElementService.DTO;

namespace SeeSpec.Services.DiagramElementService
{
    [AbpAuthorize]
    public class DiagramElementAppService : AsyncCrudAppService<DiagramElement, DiagramElementDto, Guid, PagedAndSortedResultRequestDto, DiagramElementDto, DiagramElementDto>, IDiagramElementAppService
    {
        public DiagramElementAppService(IRepository<DiagramElement, Guid> repository)
            : base(repository)
        {
        }
    }
}

