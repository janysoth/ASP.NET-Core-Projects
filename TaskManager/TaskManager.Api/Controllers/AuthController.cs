using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Dtos;
using TaskManager.Api.Services;

namespace TaskManager.Api.Controllers;

[ApiController]
// Enables automatic model validation and consistent API behavior
[Route("api/[controller]")]
// Base route: /api/auth
public sealed class AuthController : ControllerBase
{
  // Service containing all authentication business logic
  private readonly AuthService _auth;

  // Used to read configuration values from appsettings.json
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
      // Creates the user, generates an access token,
      // and issues a refresh token
      var (response, refreshToken) = await _auth.RegisterAsync(req);

      // Store refresh token securely in an HttpOnly cookie
      SetRefreshCookie(refreshToken);

      // Return access token + SAFE user info
      return Ok(response);
    }
    catch (Exception ex) when (
        ex is ArgumentException ||
        ex is InvalidOperationException
    )
    {
      // Validation errors or duplicate user registration
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
      // Validates credentials and generates tokens
      var (response, refreshToken) = await _auth.LoginAsync(req);

      // Save refresh token in HttpOnly cookie
      SetRefreshCookie(refreshToken);

      // Return access token + SAFE user info
      return Ok(response);
    }
    catch
    {
      // Do not expose authentication failure details
      return Unauthorized(new { error = "Invalid credentials." });
    }
  }

  // =========================
  // REFRESH ACCESS TOKEN
  // =========================
  [HttpPost("refresh")]
  public async Task<ActionResult<RefreshResponse>> Refresh()
  {
    try
    {
      // Cookie name from configuration or fallback
      var cookieName = _config["RefreshToken:CookieName"] ?? "tm_refresh";

      // Extract refresh token from HttpOnly cookie
      var refreshToken = Request.Cookies[cookieName];

      // Reject request if cookie is missing
      if (string.IsNullOrWhiteSpace(refreshToken))
      {
        return Unauthorized(new { error = "Missing refresh token." });
      }

      // Validate refresh token and rotate it
      var (response, newRefreshToken) =
          await _auth.RefreshAsync(refreshToken);

      // Replace old refresh token with the new one
      SetRefreshCookie(newRefreshToken);

      // Return new access token
      return Ok(response);
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
    // Cookie name from configuration or fallback
    var cookieName = _config["RefreshToken:CookieName"] ?? "tm_refresh";

    // Retrieve refresh token from cookie
    var refreshToken = Request.Cookies[cookieName];

    // Revoke refresh token server-side (if present)
    if (!string.IsNullOrWhiteSpace(refreshToken))
    {
      await _auth.RevokeAsync(refreshToken);
    }

    // Remove refresh token cookie from browser
    Response.Cookies.Delete(cookieName);

    // Return success message
    return Ok(new
    {
      message = "You have been successfully logged out."
    });
  }

  // =========================
  // COOKIE HELPER
  // =========================
  private void SetRefreshCookie(string refreshToken)
  {
    var cookieName = _config["RefreshToken:CookieName"] ?? "tm_refresh";

    Response.Cookies.Append(
        cookieName,
        refreshToken,
        new CookieOptions
        {
          // Prevent JavaScript access (XSS protection)
          HttpOnly = true,

          // MUST be true in production (HTTPS)
          Secure = false,

          // Lax allows same-site requests and mitigates CSRF
          SameSite = SameSiteMode.Lax,

          // Refresh token expiration
          Expires = DateTimeOffset.UtcNow.AddDays(
                int.Parse(_config["RefreshToken:DaysToExpire"] ?? "7")
            )
        }
    );
  }
}
