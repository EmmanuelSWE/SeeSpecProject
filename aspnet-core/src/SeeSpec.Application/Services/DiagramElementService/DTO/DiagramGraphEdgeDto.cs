namespace SeeSpec.Services.DiagramElementService.DTO
{
    public class DiagramGraphEdgeDto
    {
        public string Id { get; set; }

        public string EdgeType { get; set; }

        public string SourceNodeId { get; set; }

        public string TargetNodeId { get; set; }

        public string Label { get; set; }
    }
}
