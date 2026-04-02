using System;
using System.Collections.Generic;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class GenerateSpecCodeResponseDto
    {
        public Guid SpecId { get; set; }

        public string WorkspaceKey { get; set; }

        public GenerationRunMode GenerationMode { get; set; }

        public bool IsPreviewOnly { get; set; }

        public bool HasAppliedArtifacts { get; set; }

        public string Prompt { get; set; }

        public string Model { get; set; }

        public string OutputText { get; set; }

        public TokenUsageDto Usage { get; set; }

        public DateTime Timestamp { get; set; }

        // Artifacts are a typed preview contract. They are introduced before file writing so
        // later folder resolution, protected-region merge, and approval flow can build on the
        // same deterministic structure instead of raw AI text blobs.
        public List<GenerationArtifactDto> Artifacts { get; set; } = new List<GenerationArtifactDto>();
    }
}
