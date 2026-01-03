namespace TaskManager.Api.Models;

public sealed class RefreshTokenRecord
{
  public string TokenHash { get; set; } = "";
  public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
  public DateTime ExpiresAtUtc { get; set; }

  public DateTime? RevokedAtUtc { get; set; }
  public string? ReplacedByTokenHash { get; set; }

  public bool IsActive => RevokedAtUtc is null && DateTime.UtcNow < ExpiresAtUtc;
}
