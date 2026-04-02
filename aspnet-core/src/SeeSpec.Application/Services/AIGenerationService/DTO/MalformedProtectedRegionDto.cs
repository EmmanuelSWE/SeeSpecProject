namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class MalformedProtectedRegionDto
    {
        public string Name { get; set; }

        public string FailureReason { get; set; }

        public string RecoveredContent { get; set; }
    }
}
