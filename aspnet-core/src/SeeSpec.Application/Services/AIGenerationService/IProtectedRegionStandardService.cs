using System.Collections.Generic;
using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public interface IProtectedRegionStandardService
    {
        IReadOnlyList<ProtectedRegionDefinitionDto> GetRegions(GenerationArtifactType artifactType, string targetFilePath);

        string BuildStartMarker(string regionName);

        string BuildEndMarker(string regionName);
    }
}
