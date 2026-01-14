namespace TaskManager.Api.Settings;

public sealed class RefreshTokenSettings
{
  public int DaysToExpire { get; set; } = 7;
  public string CookieName { get; set; } = "tm_refresh";
}
