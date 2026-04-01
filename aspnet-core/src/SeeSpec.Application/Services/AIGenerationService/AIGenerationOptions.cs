namespace SeeSpec.Services.AIGenerationService
{
    public class AIGenerationOptions
    {
        public const string SectionName = "AIGeneration";
        public const string DefaultModel = "llama-3.3-70b-versatile";
        public const int DefaultTimeoutSeconds = 60;
        public const int DefaultMaxOutputTokens = 2048;
        public const double DefaultTemperature = 0.2d;

        public int TimeoutSeconds { get; set; } = DefaultTimeoutSeconds;

        public int MaxOutputTokens { get; set; } = DefaultMaxOutputTokens;

        public double Temperature { get; set; } = DefaultTemperature;
    }
}
