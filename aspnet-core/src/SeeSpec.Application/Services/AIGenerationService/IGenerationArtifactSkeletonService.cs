using System.Collections.Generic;
using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public interface IGenerationArtifactSkeletonService
    {
        string BuildSkeleton(
            GenerationArtifactType artifactType,
            string targetFilePath,
            string projectPath,
            string projectName,
            IReadOnlyList<ProtectedRegionDefinitionDto> protectedRegions);
    }
}
