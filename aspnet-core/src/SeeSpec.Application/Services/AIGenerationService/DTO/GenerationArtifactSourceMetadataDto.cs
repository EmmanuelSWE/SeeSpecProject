using System;
using System.Collections.Generic;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class GenerationArtifactSourceMetadataDto
    {
        public Guid? SpecId { get; set; }

        public string ProviderModel { get; set; }

        public DateTime GeneratedAtUtc { get; set; }

        public string PromptHash { get; set; }

        public string SourceKind { get; set; }

        public List<Guid> SourceSectionIds { get; set; } = new List<Guid>();

        public List<Guid> DependencySectionIds { get; set; } = new List<Guid>();
    }
}
