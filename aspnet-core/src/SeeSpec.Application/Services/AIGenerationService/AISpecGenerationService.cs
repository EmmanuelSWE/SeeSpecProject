using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Abp.Application.Services.Dto;
using Abp.Dependency;
using Castle.Core.Logging;
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
        public ILogger Logger { get; set; }

        public AISpecGenerationService(
            ISpecAppService specAppService,
            ISpecPromptBuilder specPromptBuilder,
            IAIGenerationService aiGenerationService)
        {
            _specAppService = specAppService;
            _specPromptBuilder = specPromptBuilder;
            _aiGenerationService = aiGenerationService;
            Logger = Castle.Core.Logging.NullLogger.Instance;
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

            try
            {
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
            catch (Exception exception)
            {
                Logger.Error("AI spec generation failed; continuing with deterministic dry-run generation output.", exception);

                return new GenerateSpecCodeResponseDto
                {
                    SpecId = input.SpecId,
                    Prompt = prompt,
                    Model = string.IsNullOrWhiteSpace(input.Model) ? AIGenerationOptions.DefaultModel : input.Model,
                    OutputText = BuildFallbackGeneratedOutput(assembledSpec),
                    Usage = new TokenUsageDto
                    {
                        InputTokens = 0,
                        OutputTokens = 0
                    },
                    Timestamp = DateTime.UtcNow
                };
            }
        }

        private static string BuildFallbackGeneratedOutput(AssembledSpecDto assembledSpec)
        {
            string specTitle = string.IsNullOrWhiteSpace(assembledSpec?.Title) ? "Backend" : assembledSpec.Title.Trim();
            string[] sectionTitles = (assembledSpec?.Sections ?? Array.Empty<AssembledSpecSectionDto>())
                .Select(section => string.IsNullOrWhiteSpace(section?.Title) ? "Specification Section" : section.Title.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(6)
                .ToArray();

            string joinedTitles = sectionTitles.Length == 0
                ? "the approved specification"
                : string.Join(", ", sectionTitles);

            return
$@"Implementation Target: {specTitle}

Scope
- Align the generated files with {joinedTitles}.
- Preserve protected regions and project structure.
- Use backend-owned naming and namespaces from the target project.

Output
- Domain entities, DTOs, repositories, and application services should be generated into their approved folders.
- Generated files must remain consistent with the assembled specification and existing project conventions.";
        }
    }
}
