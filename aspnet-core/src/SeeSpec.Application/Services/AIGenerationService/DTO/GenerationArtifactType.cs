namespace SeeSpec.Services.AIGenerationService.DTO
{
    public enum GenerationArtifactType
    {
        Unknown = 0,
        AppServiceInterface = 1,
        AppServiceClass = 2,
        Dto = 3,
        Repository = 4,
        DomainEntity = 5,
        PermissionSeed = 6
    }
}
