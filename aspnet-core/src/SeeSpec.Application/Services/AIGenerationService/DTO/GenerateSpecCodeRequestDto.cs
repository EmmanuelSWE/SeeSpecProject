using System;
using System.ComponentModel.DataAnnotations;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class GenerateSpecCodeRequestDto
    {
        [Required]
        public Guid SpecId { get; set; }

        [StringLength(256)]
        public string Model { get; set; }

        [Range(1, 32768)]
        public int? MaxTokens { get; set; }
    }
}
