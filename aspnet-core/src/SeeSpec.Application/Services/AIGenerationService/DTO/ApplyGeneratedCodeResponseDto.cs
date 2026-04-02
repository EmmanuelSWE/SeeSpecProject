using System;
using System.Collections.Generic;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class ApplyGeneratedCodeResponseDto
    {
        public Guid SpecId { get; set; }

        public string WorkspaceKey { get; set; }

        public bool RequiresApplyConfirmation { get; set; }

        public bool RequiresOverwriteConfirmation { get; set; }

        public bool AnyArtifactsApplied { get; set; }

        public bool AllArtifactsApplied { get; set; }

        public DateTime Timestamp { get; set; }

        public List<GenerationArtifactDto> Artifacts { get; set; } = new List<GenerationArtifactDto>();
    }
}
