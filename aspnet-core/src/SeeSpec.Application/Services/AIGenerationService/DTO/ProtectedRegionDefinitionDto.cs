using System.Collections.Generic;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class ProtectedRegionDefinitionDto
    {
        public string Name { get; set; }

        public string StartMarker { get; set; }

        public string EndMarker { get; set; }

        public string Language { get; set; }

        // Generator-owned files preserve only explicitly marked regions so ownership remains
        // deterministic without AST merging in this milestone.
        public bool IsManualOwnedRegion { get; set; }

        public List<string> GeneratorOwnedAreas { get; set; } = new List<string>();
    }
}
