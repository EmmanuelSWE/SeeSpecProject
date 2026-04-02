using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public interface IArtifactComparisonService
    {
        GenerationArtifactComparisonResultDto Compare(string existingContent, string generatedContent);
    }
}
