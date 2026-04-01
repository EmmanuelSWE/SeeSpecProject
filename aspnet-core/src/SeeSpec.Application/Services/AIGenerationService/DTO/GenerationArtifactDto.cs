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

        public bool ProtectedRegionsDetected { get; set; }

        // RAM workspace linkage is carried with the artifact contract so preview and final write
        // can resolve the same in-session generation set without permanent file storage.
        public string WorkspaceKey { get; set; }

        public GenerationArtifactSourceMetadataDto SourceMetadata { get; set; }
    }
}
