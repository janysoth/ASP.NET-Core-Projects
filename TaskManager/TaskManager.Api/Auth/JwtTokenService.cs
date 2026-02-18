using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TaskManager.Api.Models;
using TaskManager.Api.Settings;

namespace TaskManager.Api.Auth;

public sealed class JwtTokenService
{
  private readonly JwtSettings _settings;
  private readonly HashSet<string> _revokedTokens = new(); // In-memory revoked tokens

  public JwtTokenService(IOptions<JwtSettings> options)
  {
    _settings = options.Value;
  }

  // Create JWT Access Token
  public string CreateAccessToken(User user)
  {
    var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("fullName", user.FullName),
            new(ClaimTypes.NameIdentifier, user.Id)
        };

    var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key));
    var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: _settings.Issuer,
        audience: _settings.Audience,
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(_settings.AccessTokenMinutes),
        signingCredentials: creds
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
  }

  // Validate a JWT access token
  public bool ValidateToken(string token)
  {
    if (_revokedTokens.Contains(token))
    {
      Console.WriteLine($"Token {token} is revoked.");
      throw new SecurityTokenExpiredException("Token is revoked.");
    }

    var tokenHandler = new JwtSecurityTokenHandler();
    var validationParameters = new TokenValidationParameters
    {
      ValidateIssuerSigningKey = true,
      IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key)),
      ValidateIssuer = true,
      ValidIssuer = _settings.Issuer,
      ValidateAudience = true,
      ValidAudience = _settings.Audience,
      ValidateLifetime = true, // Validate the expiration
      ClockSkew = TimeSpan.Zero // Remove delay of token expiration
    };

    try
    {
      // Check if the token is revoked
      if (_revokedTokens.Contains(token))
      {
        throw new SecurityTokenExpiredException("Token is revoked.");
      }

      tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
      return true; // Token is valid
    }
    catch
    {
      return false; // Token is invalid
    }
  }

  // Revocation logic for the Access token
  public void RevokeToken(string token)
  {
    if (!string.IsNullOrWhiteSpace(token))
    {
      _revokedTokens.Add(token); // Store revoked token
    }
  }
}