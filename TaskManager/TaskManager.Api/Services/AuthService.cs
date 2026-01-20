using TaskManager.Api.Auth;
using TaskManager.Api.Dtos;
using TaskManager.Api.Models;
using TaskManager.Api.Repositories;

namespace TaskManager.Api.Services;

/// <summary>
/// Handles authentication logic:
/// - Register
/// - Login
/// - Access token refresh (with rotation)
/// - Refresh token revocation (logout)
/// 
/// IMPORTANT:
/// - Access tokens are short-lived JWTs
/// - Refresh tokens are long-lived, hashed, stored in MongoDB
/// </summary>
public sealed class AuthService
{
  private readonly UserRepository _users;
  private readonly JwtTokenService _jwt;
  private readonly IConfiguration _config;

  public AuthService(
      UserRepository users,
      JwtTokenService jwt,
      IConfiguration config)
  {
    _users = users;
    _jwt = jwt;
    _config = config;
  }

  // ----------------------------------------------------
  // REGISTER
  // ----------------------------------------------------
  public async Task<(AuthResponse Response, string RefreshToken)> RegisterAsync(RegisterRequest req)
  {
    // Normalize input
    var fullName = req.FullName.Trim();
    var email = req.Email.Trim().ToLowerInvariant();

    // Basic validation
    if (string.IsNullOrWhiteSpace(fullName))
      throw new ArgumentException("FullName is required.");

    if (string.IsNullOrWhiteSpace(email))
      throw new ArgumentException("Email is required.");

    if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 8)
      throw new ArgumentException("Password must be at least 8 characters.");

    // Ensure email uniqueness
    var existing = await _users.GetByEmailAsync(email);
    if (existing is not null)
      throw new InvalidOperationException("Email already registered.");

    // Create new user
    var user = new User
    {
      FullName = fullName,
      Email = email,
      PasswordHash = PasswordHasher.Hash(req.Password),
      CreatedAtUtc = DateTime.UtcNow,
      RefreshTokens = new List<RefreshTokenRecord>()
    };

    // Issue refresh token and store HASH ONLY
    var refresh = IssueRefreshToken();
    user.RefreshTokens.Add(refresh.Record);

    await _users.CreateAsync(user);

    // Issue short-lived JWT access token
    var accessToken = _jwt.CreateAccessToken(user);

    return (new AuthResponse(accessToken), refresh.RawToken);
  }

  // ----------------------------------------------------
  // LOGIN
  // ----------------------------------------------------
  public async Task<(AuthResponse Response, string RefreshToken)> LoginAsync(LoginRequest req)
  {
    var email = req.Email.Trim().ToLowerInvariant();
    var user = await _users.GetByEmailAsync(email);

    // Unified error prevents account enumeration
    if (user is null || !PasswordHasher.Verify(req.Password, user.PasswordHash))
      throw new InvalidOperationException("Invalid credentials.");

    // Issue new refresh token
    var refresh = IssueRefreshToken();
    user.RefreshTokens.Add(refresh.Record);

    // Prevent unbounded token growth
    PruneOldRefreshTokens(user);

    await _users.UpdateAsync(user);

    var accessToken = _jwt.CreateAccessToken(user);
    return (new AuthResponse(accessToken), refresh.RawToken);
  }

  // ----------------------------------------------------
  // REFRESH ACCESS TOKEN (ROTATION)
  // ----------------------------------------------------
  public async Task<(RefreshResponse Response, string NewRefreshToken)> RefreshAsync(string rawRefreshToken)
  {
    if (string.IsNullOrWhiteSpace(rawRefreshToken))
      throw new InvalidOperationException("Missing refresh token.");

    var tokenHash = Crypto.Sha256(rawRefreshToken);

    // Find the owning user (MongoDB array-field query)
    var user = await _users.GetByRefreshTokenHashAsync(tokenHash);
    if (user is null)
      throw new InvalidOperationException("Invalid refresh token.");

    var existing = user.RefreshTokens.FirstOrDefault(t => t.TokenHash == tokenHash);

    // Token must exist, not be revoked, and not expired
    if (existing is null || !existing.IsActive)
      throw new InvalidOperationException("Refresh token expired or revoked.");

    // 🔁 ROTATION:
    // Revoke old token
    existing.RevokedAtUtc = DateTime.UtcNow;

    // Issue new refresh token
    var replacement = IssueRefreshToken();
    existing.ReplacedByTokenHash = replacement.Record.TokenHash;
    user.RefreshTokens.Add(replacement.Record);

    PruneOldRefreshTokens(user);

    await _users.UpdateAsync(user);

    var newAccessToken = _jwt.CreateAccessToken(user);
    return (new RefreshResponse(newAccessToken), replacement.RawToken);
  }

  // ----------------------------------------------------
  // LOGOUT / REVOKE REFRESH TOKEN
  // ----------------------------------------------------
  public async Task RevokeAsync(string rawRefreshToken)
  {
    // No token → nothing to revoke
    if (string.IsNullOrWhiteSpace(rawRefreshToken))
      return;

    var tokenHash = Crypto.Sha256(rawRefreshToken);

    var user = await _users.GetByRefreshTokenHashAsync(tokenHash);
    if (user is null)
      return;

    var token = user.RefreshTokens
        .FirstOrDefault(t => t.TokenHash == tokenHash);

    if (token is null)
      return;

    // Soft revoke
    if (token.RevokedAtUtc is null)
      token.RevokedAtUtc = DateTime.UtcNow;

    await _users.UpdateAsync(user);
  }

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------

  /// <summary>
  /// Issues a secure refresh token.
  /// - Raw token is returned to client (cookie)
  /// - SHA256 hash is stored in DB
  /// </summary>
  private (string RawToken, RefreshTokenRecord Record) IssueRefreshToken()
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

  /// <summary>
  /// Prevents unlimited refresh token growth.
  /// Keeps most recent tokens only.
  /// </summary>
  private static void PruneOldRefreshTokens(User user)
  {
    user.RefreshTokens = user.RefreshTokens
        .OrderByDescending(t => t.CreatedAtUtc)
        .Take(20)
        .ToList();
  }
}
