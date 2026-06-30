using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SaveFoodBackend.Interfaces;

namespace SaveFoodBackend.Services;

public class SentimentService : ISentimentService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly ILogger<SentimentService> _logger;

    public SentimentService(HttpClient httpClient, IConfiguration configuration, ILogger<SentimentService> logger)
    {
        _httpClient = httpClient;
        _apiKey = configuration["Gemini:ApiKey"] ?? string.Empty;
        _logger = logger;
    }

    public async Task<(string Label, decimal Score)> AnalyzeSentimentAsync(string text, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            _logger.LogWarning("Gemini API key is not configured. Skipping sentiment analysis.");
            return ("Neutral", 0.5m);
        }

        if (string.IsNullOrWhiteSpace(text))
        {
            return ("Neutral", 0.5m);
        }

        try
        {
            var prompt = $@"
Analyze the sentiment of the following customer review for a food store.
Return the result strictly as a JSON object with exactly two keys:
- ""Label"": A string which must be exactly one of ""Positive"", ""Negative"", or ""Neutral"".
- ""Score"": A decimal number between 0.0 and 1.0 representing how positive the review is (0.0 = very negative, 0.5 = neutral, 1.0 = very positive).

Review: ""{text.Replace("\"", "\\\"")}""
";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.1,
                    responseMimeType = "application/json"
                }
            };

            var requestUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={_apiKey}";
            
            var response = await _httpClient.PostAsJsonAsync(requestUrl, requestBody, ct);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Gemini API call failed: {StatusCode} {ErrorBody}", response.StatusCode, errorBody);
                return ("Neutral", 0.5m);
            }

            var jsonDoc = await response.Content.ReadFromJsonAsync<JsonDocument>(cancellationToken: ct);
            if (jsonDoc != null)
            {
                var root = jsonDoc.RootElement;
                if (root.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
                {
                    var firstCandidate = candidates[0];
                    if (firstCandidate.TryGetProperty("content", out var content) && 
                        content.TryGetProperty("parts", out var parts) && 
                        parts.GetArrayLength() > 0)
                    {
                        var textResponse = parts[0].GetProperty("text").GetString();
                        if (!string.IsNullOrWhiteSpace(textResponse))
                        {
                            // Remove markdown json block formatting if present
                            textResponse = textResponse.Trim();
                            if (textResponse.StartsWith("```json"))
                            {
                                textResponse = textResponse.Substring(7);
                                if (textResponse.EndsWith("```"))
                                {
                                    textResponse = textResponse.Substring(0, textResponse.Length - 3);
                                }
                            }
                            
                            var resultNode = JsonNode.Parse(textResponse);
                            if (resultNode != null)
                            {
                                var label = resultNode["Label"]?.ToString() ?? "Neutral";
                                var scoreVal = resultNode["Score"]?.GetValue<decimal>() ?? 0.5m;
                                
                                return (label, scoreVal);
                            }
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during sentiment analysis with Gemini.");
        }

        return ("Neutral", 0.5m);
    }
}
