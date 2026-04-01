using System.Threading;
using System.Threading.Tasks;
using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public interface IAISpecGenerationService
    {
        Task<GenerateSpecCodeResponseDto> GenerateFromSpecAsync(GenerateSpecCodeRequestDto input, CancellationToken cancellationToken);
    }
}
