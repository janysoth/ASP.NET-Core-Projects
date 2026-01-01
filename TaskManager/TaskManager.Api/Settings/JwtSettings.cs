namespace TaskManager.Api.Settings;

public sealed class JwtSettings
{
  public string Issuer { get; set; } = "";
  public string Audience { get; set; } = "";
  public string Key { get; set; } = "";
}
