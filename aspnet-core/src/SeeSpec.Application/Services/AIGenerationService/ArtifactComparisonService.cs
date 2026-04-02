using System;
using Abp.Dependency;
using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public class ArtifactComparisonService : IArtifactComparisonService, ITransientDependency
    {
        public GenerationArtifactComparisonResultDto Compare(string existingContent, string generatedContent)
        {
            bool existingExists = !string.IsNullOrWhiteSpace(existingContent);
            if (!existingExists)
            {
                return new GenerationArtifactComparisonResultDto
                {
                    ExistingFileExists = false,
                    HasMeaningfulDifference = true
                };
            }

            string normalizedExisting = NormalizeForComparison(existingContent);
            string normalizedGenerated = NormalizeForComparison(generatedContent);

            return new GenerationArtifactComparisonResultDto
            {
                ExistingFileExists = true,
                HasMeaningfulDifference = !string.Equals(normalizedExisting, normalizedGenerated, StringComparison.Ordinal)
            };
        }

        private static string NormalizeForComparison(string content)
        {
            return string.Concat((content ?? string.Empty).Split((char[])null, StringSplitOptions.RemoveEmptyEntries));
        }
    }
}
