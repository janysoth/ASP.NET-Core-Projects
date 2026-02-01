namespace TaskManager.Api.Settings;

public sealed class JwtSettings
{
  public string Key { get; set; } = "";
  public string Issuer { get; set; } = "";
  public string Audience { get; set; } = "";
  public int AccessTokenMinutes { get; set; } = 60;
  public string CookieName { get; set; } = "tm_refresh";
  public int DaysToExpire { get; set; } = 7;
}
