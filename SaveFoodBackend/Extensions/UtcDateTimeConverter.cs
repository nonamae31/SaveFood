using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SaveFoodBackend.Extensions;

public class UtcDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.GetDateTime().ToUniversalTime();
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        var utcDate = value.Kind == DateTimeKind.Unspecified 
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc) 
            : value.ToUniversalTime();
        writer.WriteStringValue(utcDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
    }
}
