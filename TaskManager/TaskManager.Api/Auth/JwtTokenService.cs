using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TaskManager.Api.Models;
using TaskManager.Api.Settings;
using TaskManager.Api.Exceptions;

namespace TaskManager.Api.Auth;

public sealed class JwtTokenService
{
  private readonly JwtSettings _settings;
  // This should be replaced with a database or persistent store
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
    // Implement token validation logic
    if (IsTokenRevoked(token)) // Add this check
    {
      throw new TokenRevokedException("Token has been revoked.");
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
      // Check if the token is revoked using a persistent store
      if (IsTokenRevoked(token))
      {
        throw new TokenRevokedException("Token has been revoked.");
      }

      tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
      return true; // Token is valid
    }
    catch (TokenRevokedException)
    {
      throw; // Preserve stack trace
    }
    catch
    {
      return false; // Token is invalid
    }
  }

  // Check if the token is revoked (this should query a database in production)
  private bool IsTokenRevoked(string token)
  {
    return _revokedTokens.Contains(token); // Replace with a lookup for persistent storage
  }

  // Revocation logic for the Access token
  public void RevokeToken(string token)
  {
    if (!string.IsNullOrWhiteSpace(token))
    {
      // Store revoked token in the persistent store (e.g., database)
      _revokedTokens.Add(token); // For demo purposes; replace with actual persistence
    }
  }

  // Example method for verifying a refresh token (should be implemented)
  public bool ValidateRefreshToken(string refreshToken)
  {
    // Implement refresh token validation logic here
    return true; // Placeholder
  }
}