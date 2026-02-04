using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace TaskManager.Api.Helpers;

public sealed class UsDateJsonConverter : JsonConverter<DateTime?>
{
  private const string Format = "MM/dd/yyyy";

  public override DateTime? Read(
      ref Utf8JsonReader reader,
      Type typeToConvert,
      JsonSerializerOptions options)
  {
    if (reader.TokenType == JsonTokenType.Null)
      return null;

    var dateString = reader.GetString();

    if (string.IsNullOrWhiteSpace(dateString))
      return null;

    return DateTime.ParseExact(
        dateString,
        Format,
        CultureInfo.InvariantCulture,
        DateTimeStyles.AssumeUniversal
    ).ToUniversalTime();
  }

  public override void Write(
      Utf8JsonWriter writer,
      DateTime? value,
      JsonSerializerOptions options)
  {
    if (value is null)
    {
      writer.WriteNullValue();
      return;
    }

    writer.WriteStringValue(
        value.Value.ToString(Format)
    );
  }
}
