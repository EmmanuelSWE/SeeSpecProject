namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class GenerationArtifactComparisonResultDto
    {
        public bool ExistingFileExists { get; set; }

        public bool HasMeaningfulDifference { get; set; }
    }
}
