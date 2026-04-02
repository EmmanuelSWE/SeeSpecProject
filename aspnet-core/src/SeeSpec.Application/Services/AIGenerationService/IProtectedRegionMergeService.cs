using System.Collections.Generic;
using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public interface IProtectedRegionMergeService
    {
        ProtectedRegionExtractionResultDto Extract(
            string existingContent,
            string targetFilePath,
            IReadOnlyList<ProtectedRegionDefinitionDto> protectedRegions);

        ProtectedRegionMergeResultDto Reinject(
            string generatedContent,
            string targetFilePath,
            IReadOnlyList<ProtectedRegionDefinitionDto> protectedRegions,
            ProtectedRegionExtractionResultDto extractionResult);

        ProtectedRegionMergeResultDto AppendConflictedManualCode(
            string generatedContent,
            string targetFilePath,
            ProtectedRegionExtractionResultDto extractionResult);
    }
}
