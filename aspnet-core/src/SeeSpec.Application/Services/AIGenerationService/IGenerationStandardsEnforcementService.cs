using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public interface IGenerationStandardsEnforcementService
    {
        GenerationStandardsValidationResultDto Validate(
            GenerationArtifactType artifactType,
            string targetFilePath,
            string generatedContent);
    }
}
