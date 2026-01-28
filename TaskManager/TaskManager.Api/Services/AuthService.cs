using TaskManager.Api.Auth;
using TaskManager.Api.Dtos;
using TaskManager.Api.Models;
using TaskManager.Api.Repositories;

namespace TaskManager.Api.Services;

/// <summary>
/// Handles all authentication-related business logic.
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
    var fullName = req.FullName.Trim();
    var email = req.Email.Trim().ToLowerInvariant();

    if (string.IsNullOrWhiteSpace(fullName))
      throw new ArgumentException("FullName is required.");

    if (string.IsNullOrWhiteSpace(email))
      throw new ArgumentException("Email is required.");

    if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 8)
      throw new ArgumentException("Password must be at least 8 characters.");

    var existing = await _users.GetByEmailAsync(email);
    if (existing is not null)
      throw new InvalidOperationException("Email already registered.");

    var user = new User
    {
      FullName = fullName,
      Email = email,
      PasswordHash = PasswordHasher.Hash(req.Password),
      CreatedAtUtc = DateTime.UtcNow,
      RefreshTokens = new List<RefreshTokenRecord>()
    };

    var refresh = IssueRefreshToken();
    user.RefreshTokens.Add(refresh.Record);

    await _users.CreateAsync(user);

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
  // LOGIN
  // ----------------------------------------------------
  public async Task<(AuthResponse Response, string RefreshToken)> LoginAsync(LoginRequest req)
  {
    var email = req.Email.Trim().ToLowerInvariant();
    var user = await _users.GetByEmailAsync(email);

    if (user is null || !PasswordHasher.Verify(req.Password, user.PasswordHash))
      throw new InvalidOperationException("Invalid credentials.");

    var refresh = IssueRefreshToken();
    user.RefreshTokens.Add(refresh.Record);

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
  // REFRESH ACCESS TOKEN
  // ----------------------------------------------------
  public async Task<(RefreshResponse Response, string NewRefreshToken)> RefreshAsync(string rawRefreshToken)
  {
    if (string.IsNullOrWhiteSpace(rawRefreshToken))
      throw new InvalidOperationException("Missing refresh token.");

    var tokenHash = Crypto.Sha256(rawRefreshToken);

    var user = await _users.GetByRefreshTokenHashAsync(tokenHash);
    if (user is null)
      throw new InvalidOperationException("Invalid refresh token.");

    var existing = user.RefreshTokens.FirstOrDefault(t => t.TokenHash == tokenHash);
    if (existing is null || !existing.IsActive)
      throw new InvalidOperationException("Refresh token expired or revoked.");

    existing.RevokedAtUtc = DateTime.UtcNow;

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
  // LOGOUT / REVOKE REFRESH TOKEN
  // ----------------------------------------------------
  public async Task RevokeAsync(string rawRefreshToken)
  {
    if (string.IsNullOrWhiteSpace(rawRefreshToken))
      return;

    var tokenHash = Crypto.Sha256(rawRefreshToken);

    var user = await _users.GetByRefreshTokenHashAsync(tokenHash);
    if (user is null)
      return;

    var token = user.RefreshTokens.FirstOrDefault(t => t.TokenHash == tokenHash);
    if (token is null)
      return;

    if (token.RevokedAtUtc is null)
      token.RevokedAtUtc = DateTime.UtcNow;

    await _users.UpdateAsync(user);
  }

  // ----------------------------------------------------
  // GET USER BY ID
  // ----------------------------------------------------
  public async Task<User?> GetUserByIdAsync(string userId)
  {
    return await _users.GetByIdAsync(userId);
  }

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------
  private (string RawToken, RefreshTokenRecord Record) IssueRefreshToken()
  {
    var days = int.Parse(_config["RefreshToken:DaysToExpire"] ?? "7");

    var raw = Crypto.GenerateRefreshToken();
    var hash = Crypto.Sha256(raw);

    return (
        raw,
        new RefreshTokenRecord
        {
          TokenHash = hash,
          CreatedAtUtc = DateTime.UtcNow,
          ExpiresAtUtc = DateTime.UtcNow.AddDays(days)
        }
    );
  }

  private static void PruneOldRefreshTokens(User user)
  {
    user.RefreshTokens = user.RefreshTokens
        .OrderByDescending(t => t.CreatedAtUtc)
        .Take(20)
        .ToList();
  }
}
