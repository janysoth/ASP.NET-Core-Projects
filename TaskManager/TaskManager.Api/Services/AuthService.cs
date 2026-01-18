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

  public AuthService(
    UserRepository users,
    JwtTokenService jwt,
    IConfiguration config)
  {
    _users = users;
    _jwt = jwt;
    _config = config;
  }

  public async Task<(AuthResponse, string)> RegisterAsync(RegisterRequest req)
  {
    var email = req.Email.Trim().ToLower();

    if (await _users.GetByEmailAsync(email) is not null)
      throw new InvalidOperationException("Email already registered.");

    var user = new User
    {
      FullName = req.FullName.Trim(),
      Email = email,
      PasswordHash = PasswordHasher.Hash(req.Password),
      CreatedAtUtc = DateTime.UtcNow
    };

    var refresh = IssueRefreshToken();
    user.RefreshTokens.Add(refresh.Record);

    await _users.CreateAsync(user);

    return (
      new AuthResponse(_jwt.CreateAccessToken(user)),
      refresh.RawToken
    );
  }

  public async Task<(AuthResponse, string)> LoginAsync(LoginRequest req)
  {
    var user = await _users.GetByEmailAsync(req.Email.Trim().ToLower())
      ?? throw new InvalidOperationException("Invalid credentials.");

    if (!PasswordHasher.Verify(req.Password, user.PasswordHash))
      throw new InvalidOperationException("Invalid credentials.");

    var refresh = IssueRefreshToken();
    user.RefreshTokens.Add(refresh.Record);

    await _users.UpdateAsync(user);

    return (
      new AuthResponse(_jwt.CreateAccessToken(user)),
      refresh.RawToken
    );
  }

  public async Task<(RefreshResponse, string)> RefreshAsync(string rawToken)
  {
    var hash = Crypto.Sha256(rawToken);
    var user = await _users.GetByRefreshTokenHashAsync(hash)
      ?? throw new InvalidOperationException("Invalid refresh token.");

    var token = user.RefreshTokens.Single(t => t.TokenHash == hash);

    if (!token.IsActive)
      throw new InvalidOperationException("Token expired.");

    token.RevokedAtUtc = DateTime.UtcNow;

    var next = IssueRefreshToken();
    token.ReplacedByTokenHash = next.Record.TokenHash;
    user.RefreshTokens.Add(next.Record);

    user.RefreshTokens = user.RefreshTokens
      .OrderByDescending(t => t.CreatedAtUtc)
      .Take(20)
      .ToList();

    await _users.UpdateAsync(user);

    return (
      new RefreshResponse(_jwt.CreateAccessToken(user)),
      next.RawToken
    );
  }

  private (string RawToken, RefreshTokenRecord Record) IssueRefreshToken()
  {
    var days = int.Parse(_config["RefreshToken:DaysToExpire"] ?? "7");
    var raw = Crypto.GenerateRefreshToken();

    return (
      raw,
      new RefreshTokenRecord
      {
        TokenHash = Crypto.Sha256(raw),
        CreatedAtUtc = DateTime.UtcNow,
        ExpiresAtUtc = DateTime.UtcNow.AddDays(days)
      }
    );
  }
}
