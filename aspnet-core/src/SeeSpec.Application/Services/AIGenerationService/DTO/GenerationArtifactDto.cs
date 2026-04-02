using System.Collections.Generic;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class GenerationArtifactDto
    {
        // Target file path is the artifact identity for this milestone so later protected-region
        // merge and write decisions can remain deterministic by path.
        public string TargetFilePath { get; set; }

        public GenerationArtifactType ArtifactType { get; set; }

        public string GeneratedContent { get; set; }

        public bool TargetExists { get; set; }

        public bool HasMeaningfulDifference { get; set; }

        public bool ProtectedRegionsDetected { get; set; }

        // Only explicit protected regions are manual-owned. Everything else in a generator-owned
        // artifact remains owned by the generator so regeneration boundaries stay unambiguous.
        public bool IsGeneratorOwnedFile { get; set; }

        // RAM workspace linkage is carried with the artifact contract so preview and final write
        // can resolve the same in-session generation set without permanent file storage.
        public string WorkspaceKey { get; set; }

        public string WorkspaceFilePath { get; set; }

        public bool RequiresMalformedRegionDecision { get; set; }

        public bool RequiresOverwriteConfirmation { get; set; }

        public GenerationArtifactApplyStatus ApplyStatus { get; set; }

        public MalformedProtectedRegionDecision AppliedMalformedRegionDecision { get; set; }

        public MalformedProtectedRegionWarningDto MalformedRegionWarning { get; set; }

        public GenerationArtifactSourceMetadataDto SourceMetadata { get; set; }

        public List<ProtectedRegionDefinitionDto> ProtectedRegions { get; set; } = new List<ProtectedRegionDefinitionDto>();
    }
}
