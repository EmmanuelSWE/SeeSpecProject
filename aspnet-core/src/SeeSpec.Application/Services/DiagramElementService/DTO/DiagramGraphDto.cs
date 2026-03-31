using System;
using System.Collections.Generic;
using SeeSpec.Domains.SpecManagement;

namespace SeeSpec.Services.DiagramElementService.DTO
{
    public class DiagramGraphDto
    {
        public Guid DiagramElementId { get; set; }

        public string Name { get; set; }

        public DiagramType DiagramType { get; set; }

        public List<DiagramGraphNodeDto> Nodes { get; set; } = new List<DiagramGraphNodeDto>();

        public List<DiagramGraphEdgeDto> Edges { get; set; } = new List<DiagramGraphEdgeDto>();

        public Dictionary<string, string> Metadata { get; set; } = new Dictionary<string, string>();

        public string GraphHash { get; set; }

        public DiagramValidationResultDto Validation { get; set; } = new DiagramValidationResultDto();
    }
}
