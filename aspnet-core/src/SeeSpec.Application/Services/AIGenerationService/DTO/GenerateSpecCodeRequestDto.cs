using System;
using System.ComponentModel.DataAnnotations;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class GenerateSpecCodeRequestDto
    {
        [Required]
        public Guid SpecId { get; set; }

        [Required]
        public GenerationArtifactType ArtifactType { get; set; }

        [StringLength(2048)]
        public string TargetFolderPath { get; set; }

        public GenerationRunMode GenerationMode { get; set; } = GenerationRunMode.SingleArtifactFamily;

        [StringLength(256)]
        public string Model { get; set; }

        [Range(1, 32768)]
        public int? MaxTokens { get; set; }

        public MalformedProtectedRegionDecision MalformedRegionDecision { get; set; }
    }
}
