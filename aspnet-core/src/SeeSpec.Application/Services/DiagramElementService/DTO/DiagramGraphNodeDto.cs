using System.Collections.Generic;

namespace SeeSpec.Services.DiagramElementService.DTO
{
    public class DiagramGraphNodeDto
    {
        public string Id { get; set; }

        public string NodeType { get; set; }

        public string Label { get; set; }

        public string Description { get; set; }

        public List<DiagramGraphMemberDto> Members { get; set; } = new List<DiagramGraphMemberDto>();

        public Dictionary<string, string> Metadata { get; set; } = new Dictionary<string, string>();
    }
}
