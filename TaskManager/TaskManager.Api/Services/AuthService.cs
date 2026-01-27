using TaskManager.Api.Auth;
using TaskManager.Api.Dtos;
using TaskManager.Api.Models;
using TaskManager.Api.Repositories;

namespace TaskManager.Api.Services;

/// <summary>
/// Central authentication service.
/// 
/// Responsibilities:
/// - User registration
/// - User login
/// - JWT access token creation
/// - Refresh token issuance, rotation, and revocation
///
/// SECURITY MODEL:
/// - Access tokens (JWT): short-lived, stateless
/// - Refresh tokens: long-lived, stored HASHED in MongoDB
/// - Refresh tokens are rotated on every use
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
    // Normalize input to ensure consistent storage
    var fullName = req.FullName.Trim();
    var email = req.Email.Trim().ToLowerInvariant();

    // Basic validation (API-level, not domain-level)
    if (string.IsNullOrWhiteSpace(fullName))
      throw new ArgumentException("FullName is required.");

    if (string.IsNullOrWhiteSpace(email))
      throw new ArgumentException("Email is required.");

    if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 8)
      throw new ArgumentException("Password must be at least 8 characters.");

    // Enforce unique email
    var existing = await _users.GetByEmailAsync(email);
    if (existing is not null)
      throw new InvalidOperationException("Email already registered.");

    // Create new user entity
    var user = new User
    {
      FullName = fullName,
      Email = email,
      PasswordHash = PasswordHasher.Hash(req.Password),
      CreatedAtUtc = DateTime.UtcNow,
      RefreshTokens = new List<RefreshTokenRecord>()
    };

    // Issue refresh token (RAW returned to client, HASH stored)
    var refresh = IssueRefreshToken();
    user.RefreshTokens.Add(refresh.Record);

    // Persist user to MongoDB
    await _users.CreateAsync(user);

    // Create short-lived JWT access token
    var accessToken = _jwt.CreateAccessToken(user);

    // Map domain user → safe DTO
    var userDto = new AuthUserDto(
        user.Id!,
        user.FullName,
        user.Email,
        user.CreatedAtUtc
    );

    return (
        new AuthResponse(accessToken, userDto),
        refresh.RawToken
    );
  }

  // ----------------------------------------------------
  // LOGIN
  // ----------------------------------------------------
  public async Task<(AuthResponse Response, string RefreshToken)> LoginAsync(LoginRequest req)
  {
    var email = req.Email.Trim().ToLowerInvariant();

    var user = await _users.GetByEmailAsync(email);

    // Single error path prevents account enumeration
    if (user is null || !PasswordHasher.Verify(req.Password, user.PasswordHash))
      throw new InvalidOperationException("Invalid credentials.");

    // Issue new refresh token
    var refresh = IssueRefreshToken();
    user.RefreshTokens.Add(refresh.Record);

    // Prevent unlimited token accumulation
    PruneOldRefreshTokens(user);

    await _users.UpdateAsync(user);

    var accessToken = _jwt.CreateAccessToken(user);

    var userDto = new AuthUserDto(
        user.Id!,
        user.FullName,
        user.Email,
        user.CreatedAtUtc
    );

    return (
        new AuthResponse(accessToken, userDto),
        refresh.RawToken
    );
  }

  // ----------------------------------------------------
  // REFRESH ACCESS TOKEN (ROTATION)
  // ----------------------------------------------------
  public async Task<(RefreshResponse Response, string NewRefreshToken)> RefreshAsync(string rawRefreshToken)
  {
    if (string.IsNullOrWhiteSpace(rawRefreshToken))
      throw new InvalidOperationException("Missing refresh token.");

    // Never store or compare raw tokens
    var tokenHash = Crypto.Sha256(rawRefreshToken);

    // Find user owning this refresh token
    var user = await _users.GetByRefreshTokenHashAsync(tokenHash);
    if (user is null)
      throw new InvalidOperationException("Invalid refresh token.");

    var existing = user.RefreshTokens
        .FirstOrDefault(t => t.TokenHash == tokenHash);

    // Token must be active and not expired/revoked
    if (existing is null || !existing.IsActive)
      throw new InvalidOperationException("Refresh token expired or revoked.");

    // ROTATION: revoke old token
    existing.RevokedAtUtc = DateTime.UtcNow;

    // Issue replacement token
    var replacement = IssueRefreshToken();
    existing.ReplacedByTokenHash = replacement.Record.TokenHash;
    user.RefreshTokens.Add(replacement.Record);

    PruneOldRefreshTokens(user);

    await _users.UpdateAsync(user);

    var newAccessToken = _jwt.CreateAccessToken(user);

    return (
        new RefreshResponse(newAccessToken),
        replacement.RawToken
    );
  }

  // ----------------------------------------------------
  // LOGOUT / REVOKE
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

    // Soft revoke (keeps audit history)
    if (token.RevokedAtUtc is null)
      token.RevokedAtUtc = DateTime.UtcNow;

    await _users.UpdateAsync(user);
  }

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------

  /// <summary>
  /// Creates a refresh token:
  /// - RAW token → client (cookie)
  /// - HASH → database
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
  /// Limits refresh tokens per user to prevent abuse
  /// </summary>
  private static void PruneOldRefreshTokens(User user)
  {
    user.RefreshTokens = user.RefreshTokens
        .OrderByDescending(t => t.CreatedAtUtc)
        .Take(20)
        .ToList();
  }
}
