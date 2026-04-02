using System;
using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.BackendService.DTO
{
    public class ValidateGenerationFolderInputDto
    {
        public Guid BackendId { get; set; }

        public GenerationArtifactType ArtifactType { get; set; }

        public string FolderPath { get; set; }
    }
}
