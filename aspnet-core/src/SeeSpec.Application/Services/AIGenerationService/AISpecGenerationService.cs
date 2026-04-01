using System;
using System.Threading;
using System.Threading.Tasks;
using Abp.Application.Services.Dto;
using Abp.Dependency;
using SeeSpec.Services.AIGenerationService.DTO;
using SeeSpec.Services.PromptBuilderService;
using SeeSpec.Services.SpecService;
using SeeSpec.Services.SpecService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public class AISpecGenerationService : ITransientDependency, IAISpecGenerationService
    {
        private readonly ISpecAppService _specAppService;
        private readonly ISpecPromptBuilder _specPromptBuilder;
        private readonly IAIGenerationService _aiGenerationService;

        public AISpecGenerationService(
            ISpecAppService specAppService,
            ISpecPromptBuilder specPromptBuilder,
            IAIGenerationService aiGenerationService)
        {
            _specAppService = specAppService;
            _specPromptBuilder = specPromptBuilder;
            _aiGenerationService = aiGenerationService;
        }

        public async Task<GenerateSpecCodeResponseDto> GenerateFromSpecAsync(GenerateSpecCodeRequestDto input, CancellationToken cancellationToken)
        {
            if (input == null)
            {
                throw new ArgumentException("A spec generation request is required.");
            }

            if (input.SpecId == Guid.Empty)
            {
                throw new ArgumentException("SpecId is required.");
            }

            // Dry-run generation builds the prompt from canonical Spec data on the backend so the
            // frontend cannot bypass spec structure, and it does not write files or mutate Specs.
            AssembledSpecDto assembledSpec = await _specAppService.AssembleAsync(new EntityDto<Guid>(input.SpecId));
            string prompt = _specPromptBuilder.BuildPrompt(assembledSpec);

            GenerateAiResponseDto aiResponse = await _aiGenerationService.GenerateAsync(new GenerateAiRequestDto
            {
                Prompt = prompt,
                Model = input.Model,
                MaxTokens = input.MaxTokens
            }, cancellationToken);

            return new GenerateSpecCodeResponseDto
            {
                SpecId = input.SpecId,
                Prompt = prompt,
                Model = aiResponse.Model,
                OutputText = aiResponse.OutputText,
                Usage = aiResponse.Usage,
                Timestamp = aiResponse.Timestamp
            };
        }
    }
}
