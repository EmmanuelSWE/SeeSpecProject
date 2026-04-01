using System;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class GenerateSpecCodeResponseDto
    {
        public Guid SpecId { get; set; }

        public string Prompt { get; set; }

        public string Model { get; set; }

        public string OutputText { get; set; }

        public TokenUsageDto Usage { get; set; }

        public DateTime Timestamp { get; set; }
    }
}
