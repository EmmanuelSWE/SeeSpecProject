namespace SeeSpec.Services.AIGenerationService.DTO
{
    public enum GenerationArtifactApplyStatus
    {
        Staged = 0,
        SkippedExistingNoDiff = 1,
        PendingOverwrite = 2,
        BlockedByDependency = 3,
        Written = 4,
        Failed = 5
    }
}
