using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.BackendService.DTO
{
    public class AllowedGenerationFolderDto
    {
        public string FolderPath { get; set; }

        public string ProjectPath { get; set; }

        public string ProjectName { get; set; }

        public string ModuleName { get; set; }

        public string ProjectKind { get; set; }

        public GenerationArtifactType ArtifactType { get; set; }

        public bool FolderExists { get; set; }
    }
}
