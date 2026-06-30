using System.Threading;
using System.Threading.Tasks;

namespace SaveFoodBackend.Interfaces;

public interface ISentimentService
{
    /// <summary>
    /// Analyzes the sentiment of a given text.
    /// Returns (SentimentLabel, SentimentScore) where Label is "Positive", "Negative", or "Neutral",
    /// and Score is between 0.0 and 1.0 representing confidence or positivity.
    /// </summary>
    Task<(string Label, decimal Score)> AnalyzeSentimentAsync(string text, CancellationToken ct = default);
}
