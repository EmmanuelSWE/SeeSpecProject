using System;

namespace SeeSpec.Services.AIGenerationService
{
    public class AiProviderRateLimitException : Exception
    {
        public AiProviderRateLimitException(string message)
            : base(message)
        {
        }
    }

    public class AiProviderException : Exception
    {
        public AiProviderException(string message)
            : base(message)
        {
        }

        public AiProviderException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
