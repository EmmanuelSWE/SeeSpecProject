using System.Collections.Generic;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class MalformedProtectedRegionWarningDto
    {
        public string TargetFilePath { get; set; }

        public bool RequiresUserDecision { get; set; }

        public string Message { get; set; }

        public List<string> AffectedRegionNames { get; set; } = new List<string>();
    }
}
