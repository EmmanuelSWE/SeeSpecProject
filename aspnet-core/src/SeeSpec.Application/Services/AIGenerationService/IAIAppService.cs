using System.Threading.Tasks;
using Abp.Application.Services;
using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public interface IAIAppService : IApplicationService
    {
        Task<GenerateAiResponseDto> GenerateAsync(GenerateAiRequestDto input);

        Task<GenerateSpecCodeResponseDto> GenerateFromSpecAsync(GenerateSpecCodeRequestDto input);

        Task<ApplyGeneratedCodeResponseDto> ApplyGeneratedCodeAsync(ApplyGeneratedCodeRequestDto input);

        Task CleanupGenerationWorkspaceAsync(CleanupGenerationWorkspaceRequestDto input);
    }
}
