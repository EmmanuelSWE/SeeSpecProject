using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using SeeSpec.Services.DiagramElementService.DTO;

namespace SeeSpec.Services.DiagramElementService
{
    public interface IDiagramElementAppService : IAsyncCrudAppService<DiagramElementDto, Guid, PagedAndSortedResultRequestDto, DiagramElementDto, DiagramElementDto>
    {
    }
}

