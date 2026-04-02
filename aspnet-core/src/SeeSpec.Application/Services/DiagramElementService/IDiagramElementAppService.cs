using System;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using SeeSpec.Services.DiagramElementService.DTO;

namespace SeeSpec.Services.DiagramElementService
{
    public interface IDiagramElementAppService : IAsyncCrudAppService<DiagramElementDto, Guid, PagedAndSortedResultRequestDto, DiagramElementDto, DiagramElementDto>
    {
        System.Threading.Tasks.Task<DiagramGraphDto> GetGraphAsync(GetDiagramGraphDto input);

        System.Threading.Tasks.Task<DiagramSemanticActionResultDto> ApplySemanticActionAsync(ApplyDiagramSemanticActionDto input);

        System.Threading.Tasks.Task<RenderedDiagramDto> RenderSvgAsync(RenderDiagramDto input);

        System.Threading.Tasks.Task<RenderedDiagramDebugDto> RenderSvgDebugAsync(RenderDiagramDto input);
    }
}

