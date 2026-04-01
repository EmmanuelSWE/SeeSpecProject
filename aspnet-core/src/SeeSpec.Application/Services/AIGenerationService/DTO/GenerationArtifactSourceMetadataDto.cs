using System;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class GenerationArtifactSourceMetadataDto
    {
        public Guid? SpecId { get; set; }

        public string ProviderModel { get; set; }

        public DateTime GeneratedAtUtc { get; set; }

        public string PromptHash { get; set; }

        public string SourceKind { get; set; }
    }
}
