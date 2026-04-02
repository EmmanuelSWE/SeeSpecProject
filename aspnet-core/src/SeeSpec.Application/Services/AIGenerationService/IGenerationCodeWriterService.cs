using System;
using System.Threading;
using System.Threading.Tasks;
using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public interface IGenerationCodeWriterService
    {
        Task<GenerationArtifactDto> PrepareArtifactAsync(
            GenerationCodeWriterInputDto input,
            CancellationToken cancellationToken);

        Task<ApplyGeneratedCodeResponseDto> ApplyArtifactsAsync(
            ApplyGeneratedCodeRequestDto input,
            long? sessionUserId,
            CancellationToken cancellationToken);

        Task ClearWorkspaceAsync(Guid backendId, long? sessionUserId, CancellationToken cancellationToken);
    }
}
