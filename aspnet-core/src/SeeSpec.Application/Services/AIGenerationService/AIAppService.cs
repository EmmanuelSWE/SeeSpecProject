using System;
using System.Threading.Tasks;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Runtime.Session;
using SeeSpec.Domains.CodingManagement;
using SeeSpec.Domains.SpecManagement;
using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    [AbpAuthorize]
    public class AIAppService : SeeSpecAppServiceBase, IAIAppService
    {
        private readonly IAIGenerationService _aiGenerationService;
        private readonly IAISpecGenerationService _aiSpecGenerationService;
        private readonly IRepository<GenerationSnapshot, Guid> _generationSnapshotRepository;
        private readonly IRepository<Spec, Guid> _specRepository;

        public AIAppService(
            IAIGenerationService aiGenerationService,
            IAISpecGenerationService aiSpecGenerationService,
            IRepository<GenerationSnapshot, Guid> generationSnapshotRepository,
            IRepository<Spec, Guid> specRepository)
        {
            _aiGenerationService = aiGenerationService;
            _aiSpecGenerationService = aiSpecGenerationService;
            _generationSnapshotRepository = generationSnapshotRepository;
            _specRepository = specRepository;
        }

        // AI generation endpoints belong to the app-service layer so the public backend contract
        // follows the same ABP service architecture as the rest of the application.
        public Task<GenerateAiResponseDto> GenerateAsync(GenerateAiRequestDto input)
        {
            return _aiGenerationService.GenerateAsync(input, default);
        }

        public async Task<GenerateSpecCodeResponseDto> GenerateFromSpecAsync(GenerateSpecCodeRequestDto input)
        {
            GenerateSpecCodeResponseDto response = await _aiSpecGenerationService.GenerateFromSpecAsync(input, default);
            Spec spec = await _specRepository.GetAsync(input.SpecId);

            // Persist immutable generation snapshots in the standard coding-management model so
            // traceability lives in the backend service flow instead of controller code paths.
            await _generationSnapshotRepository.InsertAsync(new GenerationSnapshot
            {
                BackendId = spec.BackendId,
                SpecId = spec.Id,
                TriggeredByUserId = AbpSession.GetUserId(),
                Mode = GenerationMode.Full,
                Status = GenerationStatus.Succeeded,
                Summary = "Dry-run AI generation preview",
                AffectedSectionIdsJson = "[]",
                PromptSent = response.Prompt,
                ModelName = response.Model,
                OutputText = response.OutputText
            });
            await CurrentUnitOfWork.SaveChangesAsync();

            return response;
        }
    }
}
