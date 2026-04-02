using System;
using System.Collections.Generic;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class GenerationCodeWriterInputDto
    {
        public Guid BackendId { get; set; }

        public Guid SpecId { get; set; }

        public long? SessionUserId { get; set; }

        public string SpecTitle { get; set; }

        public GenerationArtifactType ArtifactType { get; set; }

        public string TargetFolderPath { get; set; }

        public string ProjectPath { get; set; }

        public string ProjectName { get; set; }

        public string GeneratedContent { get; set; }

        public string ProviderModel { get; set; }

        public string Prompt { get; set; }

        public DateTime GeneratedAtUtc { get; set; }

        public MalformedProtectedRegionDecision MalformedRegionDecision { get; set; }

        public Guid SourceSectionId { get; set; }

        public List<Guid> DependencySectionIds { get; set; } = new List<Guid>();
    }
}
