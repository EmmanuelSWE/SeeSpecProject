using System.Collections.Generic;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class GenerationStandardsValidationResultDto
    {
        public bool IsValid { get; set; }

        public List<string> Errors { get; set; } = new List<string>();
    }
}
