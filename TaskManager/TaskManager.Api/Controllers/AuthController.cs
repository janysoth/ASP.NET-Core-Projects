using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskManager.Api.Dtos;
using TaskManager.Api.Services;

namespace TaskManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
  private readonly AuthService _auth;
  private readonly IConfiguration _config;

  public AuthController(AuthService auth, IConfiguration config)
  {
    _auth = auth;
    _config = config;
  }

  // =========================
  // REGISTER
  // =========================
  [HttpPost("register")]
  public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
  {
    try
    {
      var (res, refreshToken) = await _auth.RegisterAsync(req);
      SetRefreshCookie(refreshToken);
      return Ok(res);
    }
    catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
    {
      return BadRequest(new { error = ex.Message });
    }
  }

  // =========================
  // LOGIN
  // =========================
  [HttpPost("login")]
  public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
  {
    try
    {
      var (res, refreshToken) = await _auth.LoginAsync(req);
      SetRefreshCookie(refreshToken);
      return Ok(res);
    }
    catch
    {
      return Unauthorized(new { error = "Invalid credentials." });
    }
  }

  // =========================
  // GET USER INFO (JWT)
  // =========================
  [Authorize]
  [HttpGet("get-user-info")]
  public async Task<ActionResult<AuthUserDto>> GetUserInfo()
  {
    var authorizationHeader = Request.Headers["Authorization"].ToString();
    var token = authorizationHeader?.Replace("Bearer ", string.Empty);

    if (token == null || !_auth.ValidateToken(token))
    {
      return Unauthorized(new { error = "There's currently no user logged in." });
    }

    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

    // Ensure userId is not null or whitespace
    if (string.IsNullOrWhiteSpace(userId))
    {
      return Unauthorized(new { error = "There's currently no user logged in." });
    }

    var user = await _auth.GetUserByIdAsync(userId);
    if (user is null)
    {
      return Unauthorized(new { error = "User not found." });
    }

    return Ok(new AuthUserDto(
        user.Id!,
        user.FullName,
        user.Email,
        user.CreatedAtUtc
    ));
  }

  // =========================
  // REFRESH TOKEN
  // =========================
  [HttpPost("refresh")]
  public async Task<ActionResult<RefreshResponse>> Refresh()
  {
    try
    {
      var cookieName = _config["RefreshToken:CookieName"] ?? "tm_refresh";
      var refreshToken = Request.Cookies[cookieName];

      var (res, newRefreshToken) = await _auth.RefreshAsync(refreshToken ?? "");
      SetRefreshCookie(newRefreshToken);

      return Ok(res);
    }
    catch
    {
      return Unauthorized(new { error = "Refresh failed." });
    }
  }

  // =========================
  // LOGOUT
  // =========================
  [HttpPost("logout")]
  public async Task<IActionResult> Logout()
  {
    var cookieName = _config["RefreshToken:CookieName"] ?? "tm_refresh";
    var refreshToken = Request.Cookies[cookieName];

    var authorizationHeader = Request.Headers["Authorization"].ToString();
    var accessToken = authorizationHeader.Replace("Bearer ", "").Trim();

    // Log whether we found a token
    Console.WriteLine($"Authorization header: {authorizationHeader}");
    Console.WriteLine($"Extracted access token: '{accessToken}'");

    if (!string.IsNullOrWhiteSpace(refreshToken) && !string.IsNullOrWhiteSpace(accessToken))
    {
      await _auth.RevokeAsync(refreshToken, accessToken);
      Console.WriteLine($"Revoking access token: {accessToken}");
    }
    else
    {
      Console.WriteLine("No access token found to revoke.");
    }

    Response.Cookies.Delete(cookieName);
    return Ok(new { message = "You have been successfully logged out." });
  }

  // =========================
  // COOKIE HELPER
  // =========================
  private void SetRefreshCookie(string refreshToken)
  {
    var cookieName = _config["RefreshToken:CookieName"] ?? "tm_refresh";

    Response.Cookies.Append(cookieName, refreshToken, new CookieOptions
    {
      HttpOnly = true,
      Secure = false, // Set true in production
      SameSite = SameSiteMode.Lax,
      Expires = DateTimeOffset.UtcNow.AddDays(
            int.Parse(_config["RefreshToken:DaysToExpire"] ?? "7")
        )
    });
  }
}