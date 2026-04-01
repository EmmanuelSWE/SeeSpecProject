using SeeSpec.Services.SpecService.DTO;

namespace SeeSpec.Services.PromptBuilderService
{
    public interface ISpecPromptBuilder
    {
        string BuildPrompt(AssembledSpecDto spec);
    }
}
