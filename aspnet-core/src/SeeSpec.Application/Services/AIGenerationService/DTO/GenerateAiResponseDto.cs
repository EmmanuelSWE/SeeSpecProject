using System;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class GenerateAiResponseDto
    {
        public string Model { get; set; }

        public string OutputText { get; set; }

        public TokenUsageDto Usage { get; set; } = new TokenUsageDto();

        public DateTime Timestamp { get; set; }
    }
}
