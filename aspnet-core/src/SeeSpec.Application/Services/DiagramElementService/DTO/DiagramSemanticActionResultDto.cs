namespace SeeSpec.Services.DiagramElementService.DTO
{
    public class DiagramSemanticActionResultDto
    {
        public DiagramGraphDto Graph { get; set; }

        public DiagramValidationResultDto Validation { get; set; }

        public string GraphHash { get; set; }

        public string MetadataJson { get; set; }
    }
}
