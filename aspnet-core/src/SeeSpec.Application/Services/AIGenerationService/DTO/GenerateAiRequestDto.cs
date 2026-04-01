using System.ComponentModel.DataAnnotations;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class GenerateAiRequestDto
    {
        [Required]
        [StringLength(12000, MinimumLength = 1)]
        public string Prompt { get; set; }

        [StringLength(128)]
        public string Model { get; set; }

        [Range(1, 32768)]
        public int? MaxTokens { get; set; }
    }
}
