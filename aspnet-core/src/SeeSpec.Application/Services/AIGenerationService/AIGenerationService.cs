using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public class AIGenerationService : SeeSpecAppServiceBase, IAIGenerationService
    {
        private const string GroqChatCompletionsUrl = "https://api.groq.com/openai/v1/chat/completions";

        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly AIGenerationOptions _options;
        private readonly ILogger<AIGenerationService> _logger;

        public AIGenerationService(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            IOptions<AIGenerationOptions> options,
            ILogger<AIGenerationService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _options = options.Value;
            _logger = logger;
        }

        public async Task<GenerateAiResponseDto> GenerateAsync(GenerateAiRequestDto input, CancellationToken cancellationToken)
        {
            ValidateRequestShape(input);

            string prompt = input.Prompt.Trim();
            string apiKey = ResolveApiKey();
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new AiProviderException("AI provider API key is not configured.");
            }

            string model = ResolveModel();
            if (!string.Equals(model, AIGenerationOptions.DefaultModel, StringComparison.Ordinal))
            {
                throw new AiProviderException("AI model configuration is invalid.");
            }

            int timeoutSeconds = _options.TimeoutSeconds > 0
                ? _options.TimeoutSeconds
                : AIGenerationOptions.DefaultTimeoutSeconds;
            int configuredMaxOutputTokens = _options.MaxOutputTokens > 0
                ? _options.MaxOutputTokens
                : AIGenerationOptions.DefaultMaxOutputTokens;
            int effectiveMaxTokens = input.MaxTokens.HasValue
                ? Math.Min(input.MaxTokens.Value, configuredMaxOutputTokens)
                : configuredMaxOutputTokens;
            double temperature = _options.Temperature >= 0d
                ? _options.Temperature
                : AIGenerationOptions.DefaultTemperature;

            string promptHash = ComputePromptHash(prompt);
            _logger.LogInformation(
                "AI generation started. PromptHash={PromptHash}, MaxTokens={MaxTokens}, Temperature={Temperature}",
                promptHash,
                effectiveMaxTokens,
                temperature);
            _logger.LogInformation(
                "AI GENERATION MODEL=llama-3.3-70b-versatile");
            _logger.LogInformation(
                "AI GENERATION PROVIDER=GROQ, API KEY PRESENT={ApiKeyPresent}",
                !string.IsNullOrWhiteSpace(apiKey));

            HttpClient httpClient = _httpClientFactory.CreateClient();
            httpClient.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            GroqChatRequest providerRequest = new GroqChatRequest
            {
                Model = model,
                Messages = new List<GroqChatMessage>
                {
                    new GroqChatMessage
                    {
                        Role = "user",
                        Content = prompt
                    }
                },
                Temperature = temperature,
                MaxTokens = effectiveMaxTokens
            };

            HttpRequestMessage requestMessage = new HttpRequestMessage(HttpMethod.Post, GroqChatCompletionsUrl)
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(providerRequest, SerializerOptions),
                    Encoding.UTF8,
                    "application/json")
            };

            HttpResponseMessage responseMessage;
            string responseBody;
            try
            {
                // This service is the only allowed AI boundary so provider details stay isolated
                // from controllers, specs, graphs, and domain logic.
                responseMessage = await httpClient.SendAsync(requestMessage, cancellationToken);
                responseBody = await responseMessage.Content.ReadAsStringAsync();
            }
            catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning(exception, "AI generation timed out. Model={Model}, PromptHash={PromptHash}", model, promptHash);
                throw new AiProviderException("AI provider request timed out.", exception);
            }
            catch (HttpRequestException exception)
            {
                _logger.LogError(exception, "AI generation transport failure. Model={Model}, PromptHash={PromptHash}", model, promptHash);
                throw new AiProviderException("AI provider request failed.", exception);
            }

            if (responseMessage.StatusCode == HttpStatusCode.TooManyRequests)
            {
                _logger.LogWarning(
                    "AI generation rate limited. Model={Model}, PromptHash={PromptHash}, ResponseBody={ResponseBody}",
                    model,
                    promptHash,
                    responseBody);
                throw new AiProviderRateLimitException(
                    $"AI provider rate limit or quota limit was reached. ResponseBody={responseBody}");
            }

            if (!responseMessage.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "AI generation provider failure. StatusCode={StatusCode}, Model={Model}, PromptHash={PromptHash}, ResponseBody={ResponseBody}",
                    (int)responseMessage.StatusCode,
                    model,
                    promptHash,
                    responseBody);
                throw new AiProviderException(
                    $"AI provider returned an unsuccessful response. StatusCode={(int)responseMessage.StatusCode}. ResponseBody={responseBody}");
            }

            GroqResponse providerResponse;
            try
            {
                providerResponse = JsonSerializer.Deserialize<GroqResponse>(responseBody, SerializerOptions);
            }
            catch (JsonException exception)
            {
                _logger.LogError(exception, "AI generation response parsing failed. Model={Model}, PromptHash={PromptHash}", model, promptHash);
                throw new AiProviderException("AI provider returned an unreadable response.", exception);
            }

            string outputText = providerResponse?.Choices?[0]?.Message?.Content ?? string.Empty;

            _logger.LogInformation(
                "AI generation succeeded. Model={Model}, PromptHash={PromptHash}, InputTokens={InputTokens}, OutputTokens={OutputTokens}",
                model,
                promptHash,
                providerResponse?.Usage?.PromptTokens,
                providerResponse?.Usage?.CompletionTokens);

            // The service returns raw provider output only. It does not interpret, apply, or
            // mutate Specs, files, graphs, or business structures.
            return new GenerateAiResponseDto
            {
                Model = model,
                OutputText = outputText,
                Usage = new TokenUsageDto
                {
                    InputTokens = providerResponse?.Usage?.PromptTokens,
                    OutputTokens = providerResponse?.Usage?.CompletionTokens
                },
                Timestamp = DateTime.UtcNow
            };
        }

        private static void ValidateRequestShape(GenerateAiRequestDto input)
        {
            // DTO validation handles request contract shape at the boundary; the AI service has no
            // knowledge of Specs, Sections, graphs, or business rules.
            if (input == null)
            {
                throw new ArgumentException("A generation request is required.");
            }

            if (string.IsNullOrWhiteSpace(input.Prompt))
            {
                throw new ArgumentException("Prompt is required.");
            }

            if (input.MaxTokens.HasValue && input.MaxTokens.Value <= 0)
            {
                throw new ArgumentException("MaxTokens must be greater than zero when provided.");
            }
        }

        private static string ComputePromptHash(string prompt)
        {
            byte[] hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(prompt ?? string.Empty));
            return Convert.ToHexString(hashBytes).Substring(0, 16);
        }

        private static string ResolveModel()
        {
            // The model is fixed by architecture so request DTO input, config drift, and
            // environment overrides cannot change provider behavior.
            return AIGenerationOptions.DefaultModel;
        }

        private string ResolveApiKey()
        {
            string configuredApiKey = _configuration["Groq:ApiKey"];
            if (!string.IsNullOrWhiteSpace(configuredApiKey))
            {
                return configuredApiKey.Trim();
            }

            return string.Empty;
        }

        private static readonly JsonSerializerOptions SerializerOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        private class GroqChatRequest
        {
            public string Model { get; set; }

            public List<GroqChatMessage> Messages { get; set; }

            public double Temperature { get; set; }

            [JsonPropertyName("max_tokens")]
            public int MaxTokens { get; set; }
        }

        private class GroqChatMessage
        {
            public string Role { get; set; }

            public string Content { get; set; }
        }

        private class GroqResponse
        {
            public List<GroqChoice> Choices { get; set; }

            public string Model { get; set; }

            public GroqUsage Usage { get; set; }
        }

        private class GroqChoice
        {
            public GroqChatMessage Message { get; set; }
        }

        private class GroqUsage
        {
            [JsonPropertyName("prompt_tokens")]
            public int? PromptTokens { get; set; }

            [JsonPropertyName("completion_tokens")]
            public int? CompletionTokens { get; set; }
        }
    }
}
