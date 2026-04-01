using System;

namespace SeeSpec.Services.DiagramElementService.DTO
{
    public class RenderDiagramDto
    {
        public Guid DiagramElementId { get; set; }

        public bool IncludePlantUmlText { get; set; }
    }
}
