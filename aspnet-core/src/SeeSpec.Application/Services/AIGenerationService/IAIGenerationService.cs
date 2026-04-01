using System.Threading;
using System.Threading.Tasks;
using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public interface IAIGenerationService
    {
        Task<GenerateAiResponseDto> GenerateAsync(GenerateAiRequestDto input, CancellationToken cancellationToken);
    }
}
