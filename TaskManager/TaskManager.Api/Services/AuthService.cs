using TaskManager.Api.Auth;
using TaskManager.Api.Dtos;
using TaskManager.Api.Models;
using TaskManager.Api.Repositories;

namespace TaskManager.Api.Services;

public sealed class AuthService
{
  private readonly UserRepository _users;
  private readonly JwtTokenService _jwt;
  private readonly IConfiguration _config;

  public AuthService(UserRepository users, JwtTokenService jwt, IConfiguration config)
  {
    _users = users;
    _jwt = jwt;
    _config = config;
  }

  public async Task<(AuthResponse Response, string RefreshToken)> RegisterAsync(RegisterRequest req)
  {
    var fullName = req.FullName.Trim();
    var email = req.Email.Trim().ToLower();

    if (string.IsNullOrWhiteSpace(fullName)) throw new ArgumentException("FullName is required.");
    if (string.IsNullOrWhiteSpace(email)) throw new ArgumentException("Email is required.");
    if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 8)
      throw new ArgumentException("Password must be at least 8 characters.");

    var existing = await _users.GetByEmailAsync(email);
    if (existing is not null) throw new InvalidOperationException("Email already registered.");

    var user = new User
    {
      FullName = fullName,
      Email = email,
      PasswordHash = PasswordHasher.Hash(req.Password),
      CreatedAtUtc = DateTime.UtcNow
    };

    var refreshToken = IssueRefreshToken(user);
    user.RefreshTokens.Add(refreshToken.Record);

    await _users.CreateAsync(user);

    var accessToken = _jwt.CreateAccessToken(user);
    return (new AuthResponse(accessToken), refreshToken.RawToken);
  }

  public async Task<(AuthResponse Response, string RefreshToken)> LoginAsync(LoginRequest req)
  {
    var email = req.Email.Trim().ToLower();
    var user = await _users.GetByEmailAsync(email);

    if (user is null) throw new InvalidOperationException("Invalid credentials.");
    if (!PasswordHasher.Verify(req.Password, user.PasswordHash))
      throw new InvalidOperationException("Invalid credentials.");

    var refreshToken = IssueRefreshToken(user);
    user.RefreshTokens.Add(refreshToken.Record);

    await _users.UpdateAsync(user);

    var accessToken = _jwt.CreateAccessToken(user);
    return (new AuthResponse(accessToken), refreshToken.RawToken);
  }

  public async Task<(RefreshResponse Response, string NewRefreshToken)> RefreshAsync(string rawRefreshToken)
  {
    if (string.IsNullOrWhiteSpace(rawRefreshToken))
      throw new InvalidOperationException("Missing refresh token.");

    var tokenHash = Crypto.Sha256(rawRefreshToken);

    // Find user that has this refresh token hash
    // (Simple approach: scan by querying refreshTokens.tokenHash)
    // MongoDB supports querying array fields like this.
    var user = await FindUserByRefreshTokenHash(tokenHash);
    if (user is null) throw new InvalidOperationException("Invalid refresh token.");

    var existing = user.RefreshTokens.FirstOrDefault(t => t.TokenHash == tokenHash);
    if (existing is null || !existing.IsActive)
      throw new InvalidOperationException("Refresh token expired or revoked.");

    // Rotate token (best practice): revoke old, issue new
    existing.RevokedAtUtc = DateTime.UtcNow;

    var newToken = IssueRefreshToken(user);
    existing.ReplacedByTokenHash = newToken.Record.TokenHash;
    user.RefreshTokens.Add(newToken.Record);

    // Optional: keep refresh token list from growing forever
    PruneOldRefreshTokens(user);

    await _users.UpdateAsync(user);

    var newAccessToken = _jwt.CreateAccessToken(user);
    return (new RefreshResponse(newAccessToken), newToken.RawToken);
  }

  public async Task RevokeAsync(string rawRefreshToken)
  {
    if (string.IsNullOrWhiteSpace(rawRefreshToken)) return;

    var tokenHash = Crypto.Sha256(rawRefreshToken);
    var user = await FindUserByRefreshTokenHash(tokenHash);
    if (user is null) return;

    var existing = user.RefreshTokens.FirstOrDefault(t => t.TokenHash == tokenHash);
    if (existing is null) return;

    if (existing.RevokedAtUtc is null)
      existing.RevokedAtUtc = DateTime.UtcNow;

    await _users.UpdateAsync(user);
  }

  private (string RawToken, RefreshTokenRecord Record) IssueRefreshToken(User user)
  {
    var days = int.Parse(_config["RefreshToken:DaysToExpire"] ?? "7");
    var raw = Crypto.GenerateRefreshToken();
    var hash = Crypto.Sha256(raw);

    var record = new RefreshTokenRecord
    {
      TokenHash = hash,
      CreatedAtUtc = DateTime.UtcNow,
      ExpiresAtUtc = DateTime.UtcNow.AddDays(days)
    };

    return (raw, record);
  }

  private void PruneOldRefreshTokens(User user)
  {
    // Keep only last 20 tokens (example)
    // In production, you might keep fewer or remove expired/revoked tokens older than X days
    user.RefreshTokens = user.RefreshTokens
        .OrderByDescending(t => t.CreatedAtUtc)
        .Take(20)
        .ToList();
  }

  private Task<User?> FindUserByRefreshTokenHash(string tokenHash)
    => _users.GetByRefreshTokenHashAsync(tokenHash);

}
