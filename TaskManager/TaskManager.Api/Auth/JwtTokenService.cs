using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TaskManager.Api.Models;

namespace TaskManager.Api.Auth;

public sealed class JwtTokenService
{
  private readonly IConfiguration _config;
  public JwtTokenService(IConfiguration config) => _config = config;

  public string CreateAccessToken(User user)
  {
    var issuer = _config["Jwt:Issuer"]!;
    var audience = _config["Jwt:Audience"]!;
    var key = _config["Jwt:Key"]!;
    var minutes = int.Parse(_config["Jwt:AccessTokenMinutes"] ?? "15");

    var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("fullName", user.FullName),
            new(ClaimTypes.NameIdentifier, user.Id)
        };

    var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
    var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: issuer,
        audience: audience,
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(minutes),
        signingCredentials: creds
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
  }
}
