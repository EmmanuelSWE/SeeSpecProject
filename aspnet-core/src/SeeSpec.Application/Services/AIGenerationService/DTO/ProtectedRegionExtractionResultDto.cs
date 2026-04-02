using System.Collections.Generic;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class ProtectedRegionExtractionResultDto
    {
        public string TargetFilePath { get; set; }

        public bool HasProtectedRegions { get; set; }

        public bool HasMalformedRegions { get; set; }

        public List<ExtractedProtectedRegionDto> Regions { get; set; } = new List<ExtractedProtectedRegionDto>();

        public List<MalformedProtectedRegionDto> MalformedRegions { get; set; } = new List<MalformedProtectedRegionDto>();
    }
}
