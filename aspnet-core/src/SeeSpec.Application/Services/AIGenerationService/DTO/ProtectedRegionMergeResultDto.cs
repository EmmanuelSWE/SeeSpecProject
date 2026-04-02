using System.Collections.Generic;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class ProtectedRegionMergeResultDto
    {
        public string TargetFilePath { get; set; }

        public string MergedContent { get; set; }

        public bool ProtectedRegionsReinjected { get; set; }

        public bool HasConsistencyErrors { get; set; }

        public List<string> MissingRegionNames { get; set; } = new List<string>();

        public bool ConflictedManualCodeAppended { get; set; }
    }
}
